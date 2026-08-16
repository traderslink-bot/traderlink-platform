# Category 12: Operators

# Category Metadata

| Field | Value |
|---|---|
| Category name | Operators |
| Category number | 12 |
| Category slug | operators |
| File name | 12-operators.md |
| Category type | Query predicate, range, set, and text-match vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-11 |
| Last updated | 2026-08-11 |
| Dependencies | Locked Category 1 intents; locked Category 11 dimensions; future Categories 13-14 date/time and comparison/ranking language; replacement Journal authorization, fact-set, coverage, currency, timezone, and Data Decisions contracts |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** Mapping does not independently
> authorize parsing, matching, text search, or a broader data query.

**Completion state:** Version 1 has controller-approved and locked canonical,
registry, evaluation, and coverage deliverables. It still authorizes neither a Chat
route nor a parser, query, data source, test, schema, or runtime capability.

**Controlling-source count resolution:** Section 7 of the complete language
plan declares eleven named operator groups in order. It declares no competing
total. The exact controlling range is therefore `C12-OP-001` through
`C12-OP-011`; no listed source group was merged, renamed, or omitted.

**Controlling inventory status:** 11 `Planned`, 0 `Unavailable`, 0
`Supported`, 0 `Unsupported`, and 0 `Deprecated`. `Planned` means a future
language/query target subject to the boundaries below; it does not claim that
any current Chat, text search, or Journal query can execute it.

---

# 1. Category Purpose

Category 12 gives the future AI Companion a small, typed vocabulary for how a
request restricts a factual population: equality and inequality; strict and
inclusive numeric/temporal comparison; two-endpoint ranges; inclusion,
exclusion, and finite-set membership; and explicitly authorized text matching.
It keeps a phrase such as “trades under $5 excluding tags in this list” from
silently changing `<` to `<=`, mixing currencies, treating a missing label as a
negative fact, or searching private source content.

The future Journal reader/query validator remains responsible for first
deriving server-authorized scope, selecting accepted current facts, applying
metric eligibility, preserving exact decimals and currency partitions,
resolving account-IANA time semantics, and returning coverage. Operators
constrain only an already-valid typed field/value relationship. They cannot
create a field, repair missing coverage, authorize an account, convert money,
change a metric formula, or turn an unresolved Data Decision into a fact.

This category owns operator vocabulary and typed composition rules. It does not
own intent routing (Category 1), dimension/metric definitions (Categories
2-11), date-language parsing (Category 13), comparison population or ranking
semantics (Category 14), conversation-state resolution, slang, ambiguity
policy, response presentation, privacy policy, protected actions, or runtime
implementation.

---

# 2. Category Boundaries

## Included

The exact controlling source vocabulary covers:

- equality and inequality predicates;
- strict and inclusive greater-than/less-than predicates;
- two-endpoint range wording;
- inclusion and exclusion filters;
- finite-set membership wording; and
- text-search wording when a separately authorized searchable field exists.

The shared planning contract additionally establishes operand compatibility,
strict/inclusive interpretation, range endpoint validation, boolean
composition, unknown/coverage handling, authorization ordering, and
privacy-safe output boundaries for those eleven source groups.

## Excluded

- Primary/secondary intent selection and protected-action confirmation:
  Category 1.
- Meaning, unit, basis, eligibility, fees, lifecycle status, and calculation of
  metrics: Categories 2-10.
- The actual fields to which an operator can apply: Category 11.
- Natural-language date, relative-window, timezone, calendar, and session
  resolution: Category 13.
- Comparison populations, group comparisons, top/bottom requests, rank
  direction, tie handling, and ranking limits: Category 14.
- Context, slang, ambiguity recovery, response preferences, and
  privacy/safety policy: Categories 15-19.
- Writes, data acquisition, full-text indexing, broker/provider calls, raw
  source browsing, and AI Chat implementation.

## Cross-Category References

- Category 1 supplies one locked intent and keeps a filter request distinct
  from a comparison, ranking, explanation, or protected action.
- Category 11 supplies the approved field identity, its factual basis,
  lifecycle/coverage state, unit, currency, account-IANA requirements, and
  account authorization boundary. An operator never broadens any of them.
- Category 13 must resolve date/time words, clock bounds, date-range endpoint
  conventions, DST, and the account-IANA calendar before temporal predicates
  execute.
- Category 14 owns `top`, `bottom`, `best`, `worst`, rank/count bounds,
  candidate population, sort direction, and tie policy. Category 12 only
  supplies comparisons that may be used after that category validates ranking.

---

# 3. Planning Analysis

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?** It maps a finite source
   vocabulary of predicate words to typed filter semantics without inventing
   operands, boundaries, facts, permissions, or matching scope.
2. **What canonical concepts belong here?** Only the eleven source-order groups
   in Section 4. Logical composition rules are shared semantics, not silent
   additions to the controlling inventory.
3. **What related concepts belong elsewhere?** Fields and facts belong to
   Categories 2-11; dates to Category 13; ranking/comparison populations to
   Category 14; all later language/policy concerns to Categories 15-19.
4. **What data is required?** A server-derived authorized account/workspace
   scope; a typed, accepted current field; exact operand(s); compatible unit,
   currency, price/fee basis, event basis, and timezone where applicable; and
   explicit coverage/decision state.
5. **Which deterministic tools will answer requests?** A future read-only
   Journal fact-set/query validator may apply a validated predicate. No tool
   or Chat execution contract is approved by this draft.
6. **Which concepts are directly observed?** A stored accepted field value,
   explicit user label, or authorized exact text field can be observed only
   when the owning record and coverage contract expose it.
7. **Which concepts are deterministically derived?** Typed predicate truth,
   set inclusion, and range membership are derived only after valid operands
   and a compatible field are supplied. They do not derive the field itself.
8. **Which concepts are proxy indicators?** None of the operators is a quality,
   causation, skill, or recommendation signal. A predicate over a proxy metric
   retains that metric's proxy limits.
9. **Which concepts are user-labelled?** Tag/label/note predicates consume only
   explicit, covered trader-authored facts; text matching never converts a
   match into a diagnosis, intent, plan, or negative fact.
10. **Which concepts are not measurable?** A field without accepted coverage,
    an incompatible value/unit/currency/time basis, a missing range endpoint,
    an unauthorized text field, or an unresolved decision returns unavailable
    coverage rather than `false`, zero, or an inferred match.
11. **Which terms are ambiguous?** `is`, `with`, `without`, `including`,
    `between`, `within`, `after`, `before`, `contains`, `any`, `top`, and
    `best` require field/type/context or their owning later category. A bare
    range has no approved inclusivity default.
12. **What defaults are safe?** Preserve explicitly stated strict/inclusive
    comparators; use server-authorized scope and the field's declared basis;
    apply `AND` only to adjacent filters at the same syntactic level when no
    alternative connector is supplied. There is no default numeric unit,
    currency/FX conversion, price/fee basis, date/session basis, range
    inclusivity, searchable text field, ranking direction, or unknown value.
13. **What conditions require clarification?** Ask one focused question when a
    value lacks its compatible unit/basis, a money predicate lacks compatible
    currency, a temporal predicate lacks a resolved event/boundary convention,
    a bare range lacks inclusivity, a mixed `and`/`or` expression lacks
    grouping, text search lacks an authorized field, or a ranking request lacks
    Category 14's population/rank meaning.
14. **What combinations are invalid?** Cross-account scope expansion;
    incompatible currency/unit comparison; implicit FX; comparing text with a
    numeric comparator; ordering arbitrary labels; reversed/unresolved range
    endpoints; one-ended `between`; treating unknown as `not equal`; using
    negation to infer absent annotations; unparenthesized mixed `AND`/`OR` with
    ambiguous scope; text search over raw/private source evidence; ranking
    before its candidate population/tie policy exists; and using a metric with
    a zero/missing denominator as if an operator could make it valid.
15. **What evaluation coverage proves completion?** Later Sections 5-8 must
    cover all eleven locked records across numeric, money, date/time, enum,
    boolean, text, and set operands; strict/inclusive endpoints; reversed and
    missing bounds; nested logic/negation; unknown/open/decision coverage;
    authorization/privacy; no-FX/no-divide-by-zero handling; and Category
    11/13/14 cross-category cases.

## 3.2 Dependencies

- **Locked earlier categories:** Category 1 supplies the stable request intent.
  Category 11 supplies an exact field/dimension, field type, accepted evidence,
  unit/basis, lifecycle state, scope, and coverage. Categories 2-10 retain
  ownership of metric calculation and eligibility.
- **Journal/module contracts:** one server-authorized user/workspace/account
  scope; accepted current facts/provenance; exact decimal values; currency
  partitioning; raw UTC plus authorized account IANA rendering; Data Decisions;
  and visible `ready_closed`, `legitimate_open`, and `needs_decision` coverage.
- **Future category dependencies:** Category 13 for date/time operands and all
  calendar/session boundary resolution; Category 14 for comparison/ranking;
  Categories 15-19 for context, terminology, ambiguity, presentation, privacy,
  and policy.
- **Text dependency:** an explicitly authorized text-field contract with a
  privacy-safe matcher/version, content-access policy, and coverage state. Its
  absence makes a particular text-search request unavailable, not a reason to
  search raw Journal evidence.
- **Unsupported dependencies:** browser/client asserted scope, guessed date or
  exchange session, raw identity/broker/source data, V3 fallback, implicit FX,
  unapproved full-text indexing, model-created labels, and a coerced zero or
  substitute denominator.

## 3.3 Risks, Overlaps, and Decisions

| Area | Draft decision / risk control |
|---|---|
| Source preservation | Preserve all eleven source headings and their order. Their example phrases are language material for later registries, not additional canonical records. |
| `is` / `with` / `without` collision | Resolve against a selected field and typed syntax. `with` can be inclusion, while `without` can be exclusion or a phrase requiring a covered negative-state contract; neither is a generic absence inference. |
| Boundary errors | Strict and inclusive comparisons remain distinct. Do not substitute `<=` for “under” or `>=` for “over”; bare range inclusion is clarified rather than guessed. |
| Money and units | Decimal comparison is exact only within a compatible unit/currency/basis partition. No FX, rounding, display-value comparison, or price/fee-basis substitution. |
| Time | `before`, `after`, and temporal ranges depend on Category 13-resolved event/boundary semantics, raw UTC/account-IANA handling, DST, and any approved local-date contract. No browser-clock or exchange-session fallback. |
| Unknown coverage | Unknown/open/decision/incomplete or unauthorized values remain visible unavailable coverage; negation and inequality do not convert them to a match. |
| Boolean scope | Do not infer precedence for ambiguous mixed connectors. Require grouping/clarification before evaluating an expression whose `AND`/`OR`/`NOT` scope could alter results. |
| Text privacy | Text matching is field-scoped and authorization-scoped. It cannot inspect or quote raw private notes, source files, identifiers, or hidden metadata; matches do not establish sentiment, discipline, or intent. |
| Ranking | A threshold predicate is not a ranking. Do not turn `largest`, `top`, or `best` into a generic operator or silently choose candidates/ties; defer to Category 14. |
| Category overlap | Category 11 owns fields and their availability; Category 12 owns predicate syntax/type validation; Category 13 owns natural-language date interpretation; Category 14 owns comparison/ranking. No category may silently take another's contract. |

## 3.4 Typed Operator and Composition Decisions

| Area | Draft decision |
|---|---|
| Operand types | A predicate declares one compatible field type before evaluation: exact decimal/integer; money with the same declared currency and basis; resolved date/time instant or local-calendar value; exact enum/identifier; explicit boolean; finite typed set; or an authorized text field. No implicit string-to-number, label-to-boolean, unit, or currency coercion. |
| Equality and inequality | `is`/`equals` are exact typed equality; `is not` is exact typed inequality only for known, covered values. Equality on money requires identical compatible currency/basis; equality on timestamps/dates requires Category 13's resolved semantics. Approximate/rounded equality is unavailable until separately defined. |
| Strict and inclusive comparison | `over`, `above`, `more than`, `greater than`, `after`, `later than` mean strict `>`; `at least`, `no less than`, and `X or more` mean `>=`; `under`, `below`, `less than`, `before`, and `earlier than` mean strict `<`; `at most`, `no more than`, `X or less`, and `up to` mean `<=`. The comparison is valid only for an ordered compatible domain; no generic text ordering. |
| Range endpoints | `between`, `from X to Y`, `within`, and `inside` require two comparable typed endpoints and a declared endpoint-order rule. If lower is greater than upper, reject/clarify rather than reorder. Bare range wording has no approved inclusive/exclusive default; it must be clarified or supplied by a later field-specific contract. |
| Inclusion / exclusion / membership | Inclusion applies an affirmative compatible property or value condition. Exclusion removes an explicitly defined compatible subset; it is not proof that a field is absent. Membership tests whether a known field value is one of a finite, typed, explicit set. `is not` is a single-value inequality and must not be merged with set exclusion. |
| Text matching | `notes mention`, `contains`, `says`, and `includes the words` may target only an explicitly authorized, covered, privacy-safe text field with a documented matcher/version. No raw statement/source-file search, hidden metadata scan, model semantic expansion, substring default, or content disclosure is approved. A missing or unauthorized text index returns unavailable coverage. |
| Boolean composition | Adjacent validated filters at the same level compose with `AND` only when no other connector appears. Explicit `OR` forms a union only of compatible predicates. `NOT` applies only to its immediately grouped predicate; a phrase with mixed `AND`/`OR` or a non-obvious negation scope requires explicit grouping/clarification. Parentheses/grouping override order. |
| Null, unknown, and unavailable | Predicate evaluation is coverage-aware: `true`, `false`, or unavailable/unknown coverage. Unknown, missing, open/decision-ineligible, unauthorized, or unresolved facts do not satisfy equality, inequality, exclusion, or negation. Do not use `not` as an absence test unless a later dedicated covered negative-state field exists. |
| Scope and authorization | Server authorization and selected account/workspace scope are fixed before predicates. Filters cannot enumerate, discover, or select another user's/account's evidence, expose raw identifiers, or change source precedence. |
| Metric safety | Operators never alter metric eligibility. A ratio retains its owning metric's strictly-positive denominator rule; zero/missing denominator is unavailable, not zero. Gross/net, price basis, event basis, and lifecycle state remain explicit. No operator creates FX conversion, a date/session default, or a derived trader label. |
| Ranking boundary | Category 12 does not treat `top`, `bottom`, `best`, `worst`, or a rank count as source operator records. Category 14 must first define a valid candidate population, metric/direction, tie policy, and limit; only then can Category 12 predicates filter that population without changing ranking semantics. |

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. It
> preserves all eleven named operator groups from Section 7 of the complete
> language plan in exact source order. No source group is omitted, merged,
> renamed, approved, or locked.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|
| 1 | C12-OP-001 | equality | Equality | Comparison predicate | Planned | Exact typed known/covered equality only; compatible unit/currency/time basis required. |
| 2 | C12-OP-002 | inequality | Inequality | Comparison predicate | Planned | Known/covered typed inequality only; unknown or missing evidence never matches by negation. |
| 3 | C12-OP-003 | greater_than | Greater Than | Ordered comparison | Planned | Strict `>` only on compatible ordered numeric/money/temporal values; no generic text ordering. |
| 4 | C12-OP-004 | greater_than_or_equal | Greater Than or Equal | Ordered comparison | Planned | Inclusive `>=` only on compatible ordered numeric/money/temporal values. |
| 5 | C12-OP-005 | less_than | Less Than | Ordered comparison | Planned | Strict `<` only on compatible ordered numeric/money/temporal values; no generic text ordering. |
| 6 | C12-OP-006 | less_than_or_equal | Less Than or Equal | Ordered comparison | Planned | Inclusive `<=` only on compatible ordered numeric/money/temporal values. |
| 7 | C12-OP-007 | range | Range | Range predicate | Planned | Two compatible explicit endpoints and declared inclusivity/order required; no bare-range default. |
| 8 | C12-OP-008 | inclusion | Inclusion | Set/property predicate | Planned | Explicit compatible affirmative property/value only; not an implicit label or text inference. |
| 9 | C12-OP-009 | exclusion | Exclusion | Set/property predicate | Planned | Explicit compatible subset only; never proves a missing/negative field state. |
| 10 | C12-OP-010 | membership | Membership | Set predicate | Planned | Finite explicit typed set and a known/covered comparable field value required. |
| 11 | C12-OP-011 | text_search | Text Search | Text predicate | Planned | Requires separately authorized covered text field and matcher/version; no raw/private/source search. |

## Proposed Inventory Additions

None. `AND`, `OR`, `NOT`, parentheses, `top`, `bottom`, sort direction, fuzzy
match, regex, approximate equality, null testing, and date/session grammar are
shared rules or later-category concerns, not additions to this source-controlled
inventory without controller approval.

## Proposed Removals or Merges

None. Equality, inequality, inclusion, exclusion, membership, and text search
have overlapping conversational wording but materially different typed and
coverage behavior. They must remain separate.

---

# 5. Canonical Inventory Deliverable

All eleven Version 1 canonical records below preserve the Section 4 inventory
order and exact `Planned` status. Their exact names are approved and locked;
this does not authorize runtime support. Predicate truth always preserves
the owning field's authorization, eligibility, and coverage boundary.

## `equality`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-001 |
| Category | Operators |
| Subcategory | Comparison predicate |
| Canonical name | equality |
| Display name | Equality |
| Exact definition | Test whether one known, covered field value exactly equals one compatible explicit operand under that field's declared value, unit, currency/basis, or Category 13 temporal contract. |
| Distinction from related concepts | It is exact typed equivalence, not approximate/display-rounded equality, inequality, set membership, text matching, or a missing-value test. |
| Evidence classification | Deterministically derived from an accepted compatible field and operand. |
| Capability status | Planned |
| Result units | Boolean match or unavailable coverage; retain field type/basis and comparison operand. |
| Open-trade support | Only where the owning field permits the lifecycle state; open/decision/incomplete coverage is never recast as a value. |
| Fee handling | Not applicable to predicate mechanics; preserves the owning field or metric's gross/net and fee-coverage contract. |
| Version | 1 |

### Related Concepts

- Broader concept: typed predicate.
- Narrower concepts: exact enum, boolean, decimal, money, and resolved temporal equality.
- Commonly confused concepts: inequality, membership, inclusion, approximate equality.
- Must not be merged with: `inequality`, `membership`, or `text_search`.

## `inequality`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-002 |
| Category | Operators |
| Subcategory | Comparison predicate |
| Canonical name | inequality |
| Display name | Inequality |
| Exact definition | Test whether one known, covered field value is not exactly equal to one compatible explicit operand; unavailable/unknown is not a non-equal match. |
| Distinction from related concepts | It compares one value against one operand, not removal of a set, a covered negative-state field, range comparison, or proof that an annotation is absent. |
| Evidence classification | Deterministically derived from an accepted compatible field and operand. |
| Capability status | Planned |
| Result units | Boolean match or unavailable coverage with the compared type/basis retained. |
| Open-trade support | Only under the owning field's eligibility; unresolved/open evidence remains coverage, not an inequality result. |
| Fee handling | Not applicable to predicate mechanics; no gross/net or fee substitution. |
| Version | 1 |

### Related Concepts

- Broader concept: typed predicate.
- Narrower concepts: exact known-value non-equality.
- Commonly confused concepts: exclusion, `not` composition, missing annotation.
- Must not be merged with: `exclusion`, `membership`, or a null/absence test.

## `greater_than`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-003 |
| Category | Operators |
| Subcategory | Ordered comparison |
| Canonical name | greater_than |
| Display name | Greater Than |
| Exact definition | Test whether a known, covered compatible ordered value is strictly greater than an explicit operand (`>`); for time, Category 13 must first resolve the selected event and bound. |
| Distinction from related concepts | It excludes equality and is not `greater_than_or_equal`, ranking, arbitrary text order, or an implicit currency conversion. |
| Evidence classification | Deterministically derived from accepted compatible ordered values. |
| Capability status | Planned |
| Result units | Boolean match or unavailable coverage; preserve exact value type, unit/currency/basis, or resolved temporal contract. |
| Open-trade support | Only if the owning value is eligible for that lifecycle; metric eligibility is unchanged. |
| Fee handling | Not applicable; a compared P/L field retains its selected gross/net fee contract. |
| Version | 1 |

### Related Concepts

- Broader concept: ordered typed predicate.
- Narrower concepts: strict numeric, money, and resolved temporal comparison.
- Commonly confused concepts: `greater_than_or_equal`, ranking, approximate comparison.
- Must not be merged with: `greater_than_or_equal` or Category 14 ranking.

## `greater_than_or_equal`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-004 |
| Category | Operators |
| Subcategory | Ordered comparison |
| Canonical name | greater_than_or_equal |
| Display name | Greater Than or Equal |
| Exact definition | Test whether a known, covered compatible ordered value is greater than or exactly equal to an explicit operand (`>=`); temporal operands require Category 13 resolution. |
| Distinction from related concepts | It includes the endpoint and is not strict greater-than, a range, a ranking, or generic lexical ordering. |
| Evidence classification | Deterministically derived from accepted compatible ordered values. |
| Capability status | Planned |
| Result units | Boolean match or unavailable coverage with exact compatible comparison metadata. |
| Open-trade support | Only under the owning value's lifecycle eligibility; no inferred realized result. |
| Fee handling | Not applicable; preserve the owning field's fee basis and coverage. |
| Version | 1 |

### Related Concepts

- Broader concept: ordered typed predicate.
- Narrower concepts: inclusive numeric, money, and resolved temporal comparison.
- Commonly confused concepts: `greater_than`, range upper/lower endpoints, `top` ranking.
- Must not be merged with: `greater_than` or Category 14 rank direction.

## `less_than`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-005 |
| Category | Operators |
| Subcategory | Ordered comparison |
| Canonical name | less_than |
| Display name | Less Than |
| Exact definition | Test whether a known, covered compatible ordered value is strictly less than an explicit operand (`<`); for time, Category 13 must first resolve event and bound. |
| Distinction from related concepts | It excludes equality and is not `less_than_or_equal`, a range, arbitrary text order, or an inferred date/session convention. |
| Evidence classification | Deterministically derived from accepted compatible ordered values. |
| Capability status | Planned |
| Result units | Boolean match or unavailable coverage with exact compatible comparison metadata. |
| Open-trade support | Only under owning-field eligibility; open/decision rows do not acquire closed-metric values. |
| Fee handling | Not applicable; preserve the owning field's selected fee basis. |
| Version | 1 |

### Related Concepts

- Broader concept: ordered typed predicate.
- Narrower concepts: strict numeric, money, and resolved temporal comparison.
- Commonly confused concepts: `less_than_or_equal`, range, ranking.
- Must not be merged with: `less_than_or_equal` or a date-language default.

## `less_than_or_equal`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-006 |
| Category | Operators |
| Subcategory | Ordered comparison |
| Canonical name | less_than_or_equal |
| Display name | Less Than or Equal |
| Exact definition | Test whether a known, covered compatible ordered value is less than or exactly equal to an explicit operand (`<=`); temporal operands require Category 13 resolution. |
| Distinction from related concepts | It includes equality and is not strict less-than, range membership, a bucket, or ranking. |
| Evidence classification | Deterministically derived from accepted compatible ordered values. |
| Capability status | Planned |
| Result units | Boolean match or unavailable coverage with exact compatible comparison metadata. |
| Open-trade support | Only under owning-field eligibility; unavailable states remain visible coverage. |
| Fee handling | Not applicable; preserve the owning field's selected fee basis. |
| Version | 1 |

### Related Concepts

- Broader concept: ordered typed predicate.
- Narrower concepts: inclusive numeric, money, and resolved temporal comparison.
- Commonly confused concepts: `less_than`, range endpoints, `bottom` ranking.
- Must not be merged with: `less_than` or Category 14 ranking.

## `range`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-007 |
| Category | Operators |
| Subcategory | Range predicate |
| Canonical name | range |
| Display name | Range |
| Exact definition | Test whether one known, covered compatible ordered value lies between two explicit comparable endpoints under a declared inclusive/exclusive boundary rule; reject or clarify reversed endpoints and never silently reorder them. |
| Distinction from related concepts | It requires two endpoints and declared boundary treatment, unlike one-sided comparisons, a saved bucket, date-language parsing, or a finite-set membership test. |
| Evidence classification | Deterministically derived from an accepted compatible value, two operands, and declared endpoint treatment. |
| Capability status | Planned |
| Result units | Boolean match or unavailable/clarification state with both endpoints, order, type/basis, and inclusivity retained. |
| Open-trade support | Only under owning-field eligibility; an unavailable lifecycle value cannot be ranged. |
| Fee handling | Not applicable; any selected P/L range retains its existing gross/net fee coverage. |
| Version | 1 |

### Related Concepts

- Broader concept: ordered typed predicate.
- Narrower concepts: numeric, money, and Category 13-resolved temporal interval.
- Commonly confused concepts: `greater_than`, `less_than`, saved bucket, date range.
- Must not be merged with: one-sided comparisons, Category 13 date grammar, or `membership`.

## `inclusion`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-008 |
| Category | Operators |
| Subcategory | Set/property predicate |
| Canonical name | inclusion |
| Display name | Inclusion |
| Exact definition | Require an explicit compatible affirmative property, label, or value condition on a known, covered field; the condition cannot create or infer a trader-authored fact. |
| Distinction from related concepts | It asserts an affirmative compatible condition, not a finite-set test, text match, inequality, or generic claim that a field exists. |
| Evidence classification | Deterministically derived from an accepted compatible fact; user-labelled when the owning field is an explicit trader label. |
| Capability status | Planned |
| Result units | Boolean match or unavailable coverage with the field/property and evidence boundary retained. |
| Open-trade support | Only when the owned property is valid for the lifecycle; no label is inferred from status or outcome. |
| Fee handling | Not applicable unless the included owning field is a fee-scoped metric, whose contract remains unchanged. |
| Version | 1 |

### Related Concepts

- Broader concept: set/property predicate.
- Narrower concepts: covered label/property inclusion.
- Commonly confused concepts: membership, text search, equality, presence inference.
- Must not be merged with: `membership`, `text_search`, or a missing-field test.

## `exclusion`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-009 |
| Category | Operators |
| Subcategory | Set/property predicate |
| Canonical name | exclusion |
| Display name | Exclusion |
| Exact definition | Remove a defined compatible subset from an already authorized candidate population using a known, covered predicate or set; it does not prove a field, label, note, or attachment is absent. |
| Distinction from related concepts | It removes an explicit subset, unlike one-value inequality, boolean `NOT`, a null test, or a change to account authorization. |
| Evidence classification | Deterministically derived from authorized candidates and a valid compatible predicate/set. |
| Capability status | Planned |
| Result units | Filtered population plus visible excluded/unavailable coverage; never a fabricated negative fact. |
| Open-trade support | May exclude eligible open rows only under the owning filter contract; unavailable rows stay coverage. |
| Fee handling | Not applicable; it cannot remove fee-incomplete coverage by pretending it is a fact. |
| Version | 1 |

### Related Concepts

- Broader concept: set/property predicate.
- Narrower concepts: explicit subset removal.
- Commonly confused concepts: `inequality`, logical `NOT`, `notes_missing`.
- Must not be merged with: `inequality`, null/absence testing, or authorization scope.

## `membership`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-010 |
| Category | Operators |
| Subcategory | Set predicate |
| Canonical name | membership |
| Display name | Membership |
| Exact definition | Test whether one known, covered compatible field value is an element of one finite explicit typed set; each member must share the field's exact type, unit, currency/basis, or resolved temporal contract. |
| Distinction from related concepts | It compares to a finite set, not one-value equality, affirmative inclusion, exclusion, a range, or fuzzy text search. |
| Evidence classification | Deterministically derived from an accepted compatible field value and explicit typed members. |
| Capability status | Planned |
| Result units | Boolean match or unavailable coverage with the finite set and type/basis retained. |
| Open-trade support | Only under owning-field eligibility; unknown/open/decision values never gain a member value by inference. |
| Fee handling | Not applicable; fee-scoped values require compatible selected fee basis before membership. |
| Version | 1 |

### Related Concepts

- Broader concept: typed set predicate.
- Narrower concepts: finite enum, identifier, boolean, decimal, money, and resolved temporal set membership.
- Commonly confused concepts: equality, inclusion, exclusion, range.
- Must not be merged with: `equality`, `inclusion`, or `range`.

## `text_search`

| Field | Value |
|---|---|
| Inventory ID | C12-OP-011 |
| Category | Operators |
| Subcategory | Text predicate |
| Canonical name | text_search |
| Display name | Text Search |
| Exact definition | Test an explicitly authorized, covered, privacy-safe text field against an explicit query under a documented matcher/version; no raw source, hidden metadata, model semantic expansion, or default substring behavior is permitted. |
| Distinction from related concepts | It is a field-scoped text predicate, not semantic retrieval, label inclusion, equality, a diagnosis, sentiment inference, or authority to expose matched content. |
| Evidence classification | Directly observed authorized text field plus deterministically derived documented match result. |
| Capability status | Planned |
| Result units | Boolean match or unavailable coverage with authorized field identity and matcher/version; no raw matched text disclosure. |
| Open-trade support | Only if the authorized text field is covered for that lifecycle; missing/unavailable text is not a non-match. |
| Fee handling | Not applicable. |
| Version | 1 |

### Related Concepts

- Broader concept: field-scoped typed predicate.
- Narrower concepts: authorized documented text match.
- Commonly confused concepts: inclusion, equality, note presence, semantic search.
- Must not be merged with: `inclusion`, `equality`, `notes_present`, or unapproved full-text retrieval.

---

# 6. Language Registry Deliverable

## Registry Completion State

Registry Batches 1-2b draft `C12-OP-001` through `C12-OP-011` in controlling
order. Each registry has all 38 required subsections, retains `Planned`, and
binds only the locked Category 1 factual Journal-request intents listed below.
It creates no intent, alias policy, ticker resolution, query, parser, tool, or
runtime capability.

**Registry progress:** 11 of 11 records and all 38 subsections per registry
passed independent review and are approved and locked in Version 1. This does
not authorize runtime capability.

## 6.1 Canonical: equality

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-001-R1. |
| 02 | Canonical record | `equality`; Section 4 Comparison predicate record. |
| 03 | Display label | Equality. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume a validated equality predicate. |
| 07 | Intent non-expansion | Does not create search, account lookup, identity, comparison, ranking, write, or protected-action intent. |
| 08 | Primary semantic role | Exact typed equality between one compatible known/covered field and one explicit operand. |
| 09 | Direct evidence | Accepted current Category 11 field value and explicit typed operand; predicate truth is derived. |
| 10 | Authorized scope | Server authorization fixes user/workspace/account scope before comparison; equality cannot discover other evidence. |
| 11 | Default resolution | Preserve the field's exact type and declared basis; no default field, unit, currency, date event, or session. |
| 12 | Accepted literals | `is`, `was`, `equals`, `exactly`, `only`. |
| 13 | Realistic variants | `equals $5`, `is long`, `was a winner`, `only this tag` after an explicit compatible field is supplied. |
| 14 | Morphology/case | Case normalizes ordinary operator wording only; field values retain their owning Category 11 matching/case contract. |
| 15 | Safe output | Privacy-safe match/count/coverage and declared field/basis only; no raw identifiers or source content. |
| 16 | Privacy boundary | Never expose auth subjects, broker account numbers, internal IDs, source rows, or private note text. |
| 17 | Disallowed identifiers | Client-supplied user/account IDs, raw broker identifiers, internal UUIDs, tokens, and untrusted source IDs. |
| 18 | Provenance / fact boundary | Equality compares a covered field; it does not make provenance, trader labels, or Data Decisions factual when absent. |
| 19 | Currency / money boundary | Money equality requires identical compatible currency and price/fee basis; no FX, rounding, or display-value comparison. |
| 20 | Lifecycle coverage | Applies only where the field is eligible; `ready_closed`, `legitimate_open`, and `needs_decision` remain separately covered. |
| 21 | Unavailable/incomplete coverage | Missing, unknown, unresolved, unauthorized, or incompatible values return unavailable coverage, never true/false. |
| 22 | Related dimension boundary | Category 11 owns field selection, including ticker; `is AAPL` is valid only after a covered explicit ticker field is chosen, never by guessed ticker alias. |
| 23 | False positives | `is this a good trade`, `is this caused by news`, `is AAPL` without field context, and approximate `about $5` are not direct equality. |
| 24 | Negation | `not` is not equality; unknown does not become a non-match through negation. |
| 25 | Correction | If the user means a set, use `membership`; if they mean approximate/rounded value, clarify because no approximation operator is approved. |
| 26 | Follow-up | Retain an explicit compatible field from trusted context only; otherwise ask for the field, not a raw ID. |
| 27 | One-field clarification | “Which field should equal that value?” |
| 28 | Combination rule | May combine with compatible validated predicates under explicit boolean scope; it cannot set scope or eligibility. |
| 29 | Filter/group rule | Filters one authorized typed field; grouping remains owned by the requested dimension and intent. |
| 30 | Comparison/ranking boundary | Equality may filter an already valid population; Category 14 owns comparison populations, top/bottom, direction, and ties. |
| 31 | No inference | Do not infer field, unit, currency, time basis, ticker alias, session, label, or missing value. |
| 32 | No causation/advice | A match proves no cause, quality, skill, forecast, or trading advice. |
| 33 | Error / unavailable reply | State that exact comparison needs a covered compatible field/value and disclose coverage safely. |
| 34 | Do-not-answer | Do not reveal private identifiers, raw text, another account, or fabricate equality from incomplete evidence. |
| 35 | Cross-category dependency | Category 11 owns operands; Category 13 resolves temporal equality; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No parser, query, index, account API, or Chat capability is authorized. |
| 37 | Evaluation cases | Enum equality, compatible money equality, temporal equality after Category 13, unknown value, ticker-alias rejection, and scope attempt. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.2 Canonical: inequality

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-002-R1. |
| 02 | Canonical record | `inequality`; Section 4 Comparison predicate record. |
| 03 | Display label | Inequality. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume a validated inequality predicate. |
| 07 | Intent non-expansion | Does not create absence detection, data repair, account lookup, write, or protected-action intent. |
| 08 | Primary semantic role | Exact typed non-equality of one known/covered compatible field and one explicit operand. |
| 09 | Direct evidence | Accepted current Category 11 field value and explicit typed operand; predicate truth is derived. |
| 10 | Authorized scope | Server authorization selects evidence before comparison; inequality cannot expand or enumerate scope. |
| 11 | Default resolution | Compare only known compatible values; no default field, absence state, unit, currency, date event, or session. |
| 12 | Accepted literals | `is not`, `anything except` when one exact compatible value is supplied. |
| 13 | Realistic variants | `not long`, `isn't USD`, `anything except this tag` only with a covered typed field. |
| 14 | Morphology/case | Negated forms normalize only to exact typed non-equality; field matching preserves the owning field contract. |
| 15 | Safe output | Privacy-safe filtered count and unavailable coverage; never expose unmatched private values. |
| 16 | Privacy boundary | Never use non-equality to enumerate hidden accounts, identifiers, notes, or source content. |
| 17 | Disallowed identifiers | Raw user/account/broker IDs, internal UUIDs, source IDs, tokens, and guessed ticker aliases. |
| 18 | Provenance / fact boundary | It cannot prove an unlabelled record lacks provenance, a tag, a note, or a review. |
| 19 | Currency / money boundary | Money inequality requires compatible currency and basis; no FX, rounding, or mixed-currency comparison. |
| 20 | Lifecycle coverage | Only applies to values eligible for the lifecycle; open/decision/incomplete coverage is preserved. |
| 21 | Unavailable/incomplete coverage | Unknown, missing, unauthorized, unresolved, or incompatible values are unavailable—not “not equal.” |
| 22 | Related dimension boundary | Category 11 owns explicit negative-state dimensions such as `unknown_direction`; inequality cannot synthesize a missing-state dimension. |
| 23 | False positives | `without notes`, `not reviewed`, `not this account`, and `not AAPL` without field/context are not safe generic inequality. |
| 24 | Negation | This record is one-value non-equality; nested `NOT` scope belongs to the shared boolean rule and cannot infer absence. |
| 25 | Correction | If the request removes a set/subset, use `exclusion`; if it asks for a covered negative field, use that field after validation. |
| 26 | Follow-up | Ask for the one field being compared when context does not supply it. |
| 27 | One-field clarification | “Which field should not equal that value?” |
| 28 | Combination rule | May combine only with compatible validated predicates and explicit/clear boolean scope. |
| 29 | Filter/group rule | Filters one known typed field; it does not group or enumerate nonmatching values. |
| 30 | Comparison/ranking boundary | It may filter a valid population only; Category 14 owns comparisons, rank direction, population, and ties. |
| 31 | No inference | Never infer null, label absence, unknown direction, unit, currency, date/session, or ticker synonym. |
| 32 | No causation/advice | Non-match proves no quality, cause, discipline, or recommendation. |
| 33 | Error / unavailable reply | State that a known covered compatible value is required; keep unavailable coverage visible. |
| 34 | Do-not-answer | Do not disclose excluded private values or turn missing annotations into `not` matches. |
| 35 | Cross-category dependency | Category 11 owns fields/negative states; Category 13 resolves temporal operands; Category 14 owns ranking; Category 19 owns privacy. |
| 36 | Runtime boundary | No query, absence scan, parser, or Chat capability is authorized. |
| 37 | Evaluation cases | Exact enum non-equality, mixed currency rejection, missing note refusal, unknown direction, nested-not ambiguity, and scope attempt. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.3 Canonical: greater_than

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-003-R1. |
| 02 | Canonical record | `greater_than`; Section 4 Ordered comparison record. |
| 03 | Display label | Greater Than. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume a validated strict comparison. |
| 07 | Intent non-expansion | Does not create ranking, prediction, market screening, recommendation, session lookup, or write intent. |
| 08 | Primary semantic role | Strict compatible ordered comparison: field value `>` explicit operand. |
| 09 | Direct evidence | Accepted current ordered Category 11/metric value and explicit typed operand; truth is derived. |
| 10 | Authorized scope | Server-authorized scope and field eligibility are fixed before the comparison. |
| 11 | Default resolution | Preserve strictness; no default unit, currency/basis, date event, session, threshold, or ordered text field. |
| 12 | Accepted literals | `over`, `above`, `more than`, `greater than`, `after`, `later than`. |
| 13 | Realistic variants | `over $5`, `more than 100 shares`, `after 10:00`, `later than Tuesday` only with compatible field/basis. |
| 14 | Morphology/case | Ordinary greater-than wording normalizes to strict `>` only; it never becomes `>=`. |
| 15 | Safe output | Privacy-safe match/count/coverage plus declared strict comparator and compatible basis. |
| 16 | Privacy boundary | Never expose raw IDs, private text, hidden account values, or source payloads. |
| 17 | Disallowed identifiers | Client-supplied identity/account IDs, raw broker IDs, internal UUIDs, and untrusted ticker aliases. |
| 18 | Provenance / fact boundary | It orders an already accepted compatible value; it does not establish source reliability or trader label truth. |
| 19 | Currency / money boundary | Money comparison needs identical compatible currency and price/fee basis; no FX or display rounding. |
| 20 | Lifecycle coverage | Only eligible lifecycle values compare; open/decision/incomplete rows remain coverage and cannot gain realized metrics. |
| 21 | Unavailable/incomplete coverage | Missing/zero-denominator metric, unknown, incompatible, unresolved, or unauthorized values return unavailable. |
| 22 | Related dimension boundary | Category 11 supplies numeric/money/time operands; Category 13 must resolve `after`/`later` event and timezone semantics before use. |
| 23 | False positives | `best trades`, `higher quality`, `more disciplined`, `above VWAP` without approved field, and ticker lexical order are not this predicate. |
| 24 | Negation | `not over` requires grouped boolean scope; unknown is not treated as `<=`. |
| 25 | Correction | If equality should count, use `greater_than_or_equal`; if the request is rank/top-N, defer to Category 14. |
| 26 | Follow-up | Ask for the one missing field/basis or threshold; do not infer it from slang. |
| 27 | One-field clarification | “What value and basis should be strictly greater than that threshold?” |
| 28 | Combination rule | May combine with compatible filters under clear `AND`/`OR`/`NOT` scope; no implicit population rewrite. |
| 29 | Filter/group rule | Filters a typed ordered field; grouping does not change comparator meaning. |
| 30 | Comparison/ranking boundary | Strict threshold is not `top`/`best`; Category 14 owns ranking population, direction, and ties. |
| 31 | No inference | Do not infer a price/fee basis, FX, date event, account timezone, exchange session, ticker alias, or denominator. |
| 32 | No causation/advice | Greater value does not prove edge, cause, quality, forecast, or advice. |
| 33 | Error / unavailable reply | State that strict comparison needs a covered compatible ordered field and explicit basis/threshold. |
| 34 | Do-not-answer | Do not fabricate market/session data, order generic text, or answer with an unsafe trading recommendation. |
| 35 | Cross-category dependency | Categories 2-11 own values; Category 13 owns time grammar; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No parser, market-data lookup, query, or Chat capability is authorized. |
| 37 | Evaluation cases | Strict money boundary, equal-value exclusion, typed quantity, Category 13 time, zero denominator, no-FX, rank correction. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.4 Canonical: greater_than_or_equal

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-004-R1. |
| 02 | Canonical record | `greater_than_or_equal`; Section 4 Ordered comparison record. |
| 03 | Display label | Greater Than or Equal. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume a validated inclusive comparison. |
| 07 | Intent non-expansion | Does not create ranking, prediction, market screening, recommendation, session lookup, or write intent. |
| 08 | Primary semantic role | Inclusive compatible ordered comparison: field value `>=` explicit operand. |
| 09 | Direct evidence | Accepted current ordered Category 11/metric value and explicit typed operand; truth is derived. |
| 10 | Authorized scope | Server-authorized scope and field eligibility are fixed before the comparison. |
| 11 | Default resolution | Preserve endpoint inclusion; no default unit, currency/basis, date event, session, threshold, or ordered text field. |
| 12 | Accepted literals | `at least`, `no less than`, `X or more`. |
| 13 | Realistic variants | `at least $5`, `100 or more shares`, `no less than two trades` only with compatible field and population contract. |
| 14 | Morphology/case | Inclusive wording normalizes only to `>=`; it never becomes strict `>`. |
| 15 | Safe output | Privacy-safe match/count/coverage plus declared inclusive comparator and compatible basis. |
| 16 | Privacy boundary | Never expose raw IDs, private text, hidden account values, or source payloads. |
| 17 | Disallowed identifiers | Client-supplied identity/account IDs, raw broker IDs, internal UUIDs, and untrusted ticker aliases. |
| 18 | Provenance / fact boundary | It compares accepted compatible values only; it does not establish source reliability or trader label truth. |
| 19 | Currency / money boundary | Money comparison needs identical compatible currency and price/fee basis; no FX or display rounding. |
| 20 | Lifecycle coverage | Only eligible lifecycle values compare; open/decision/incomplete rows remain coverage and cannot gain realized metrics. |
| 21 | Unavailable/incomplete coverage | Missing/zero-denominator metric, unknown, incompatible, unresolved, or unauthorized values return unavailable. |
| 22 | Related dimension boundary | Category 11 supplies numeric/money/time operands; Category 13 resolves time endpoint/event semantics before use. |
| 23 | False positives | `top trades`, `at least as good`, `more disciplined`, generic text sorting, and approximate threshold are not this predicate. |
| 24 | Negation | `not at least` requires grouped boolean scope; unknown does not become strict-less match. |
| 25 | Correction | If equality must be excluded, use `greater_than`; if a two-sided interval is intended, use `range`. |
| 26 | Follow-up | Ask for the one missing field/basis or threshold; do not derive it from ticker, session, or outcome wording. |
| 27 | One-field clarification | “What value and basis should be at least that threshold?” |
| 28 | Combination rule | May combine with compatible filters under clear boolean scope; no default conjunction across ambiguous phrases. |
| 29 | Filter/group rule | Filters a typed ordered field; grouping preserves the same inclusive comparator. |
| 30 | Comparison/ranking boundary | Inclusive threshold is not rank direction or top-N; Category 14 owns ranking semantics. |
| 31 | No inference | Do not infer price/fee basis, FX, date event, account timezone, exchange session, ticker alias, or denominator. |
| 32 | No causation/advice | Meeting threshold proves no edge, cause, quality, forecast, or advice. |
| 33 | Error / unavailable reply | State that an inclusive comparison needs a covered compatible ordered field and explicit basis/threshold. |
| 34 | Do-not-answer | Do not fabricate market/session data, order generic text, or produce trading advice. |
| 35 | Cross-category dependency | Categories 2-11 own values; Category 13 owns time grammar; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No parser, market-data lookup, query, or Chat capability is authorized. |
| 37 | Evaluation cases | Equal-value inclusion, strict-versus-inclusive correction, money basis, quantity, temporal endpoint, unknown coverage, rank correction. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.5 Canonical: less_than

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-005-R1. |
| 02 | Canonical record | `less_than`; Section 4 Ordered comparison record. |
| 03 | Display label | Less Than. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume a validated strict comparison. |
| 07 | Intent non-expansion | Does not create ranking, prediction, market screening, recommendation, session lookup, or write intent. |
| 08 | Primary semantic role | Strict compatible ordered comparison: field value `<` explicit operand. |
| 09 | Direct evidence | Accepted current ordered Category 11/metric value and explicit typed operand; truth is derived. |
| 10 | Authorized scope | Server-authorized scope and field eligibility are fixed before the comparison. |
| 11 | Default resolution | Preserve strictness; no default unit, currency/basis, date event, session, threshold, or ordered text field. |
| 12 | Accepted literals | `under`, `below`, `less than`, `before`, `earlier than`. |
| 13 | Realistic variants | `under $5`, `below 100 shares`, `before 10:00`, `earlier than Tuesday` only with compatible field/basis. |
| 14 | Morphology/case | Ordinary less-than wording normalizes to strict `<` only; it never becomes `<=`. |
| 15 | Safe output | Privacy-safe match/count/coverage plus declared strict comparator and compatible basis. |
| 16 | Privacy boundary | Never expose raw IDs, private text, hidden account values, or source payloads. |
| 17 | Disallowed identifiers | Client-supplied identity/account IDs, raw broker IDs, internal UUIDs, and untrusted ticker aliases. |
| 18 | Provenance / fact boundary | It orders an accepted compatible value; it does not establish source reliability or trader label truth. |
| 19 | Currency / money boundary | Money comparison needs identical compatible currency and price/fee basis; no FX or display rounding. |
| 20 | Lifecycle coverage | Only eligible lifecycle values compare; open/decision/incomplete rows remain coverage and cannot gain realized metrics. |
| 21 | Unavailable/incomplete coverage | Missing/zero-denominator metric, unknown, incompatible, unresolved, or unauthorized values return unavailable. |
| 22 | Related dimension boundary | Category 11 supplies numeric/money/time operands; Category 13 must resolve `before`/`earlier` event and timezone semantics before use. |
| 23 | False positives | `worst trades`, `lower quality`, `less disciplined`, `below VWAP` without approved field, and ticker lexical order are not this predicate. |
| 24 | Negation | `not under` requires grouped boolean scope; unknown is not treated as `>=`. |
| 25 | Correction | If equality should count, use `less_than_or_equal`; if the request is bottom-N/ranking, defer to Category 14. |
| 26 | Follow-up | Ask for the one missing field/basis or threshold; do not infer it from slang. |
| 27 | One-field clarification | “What value and basis should be strictly less than that threshold?” |
| 28 | Combination rule | May combine with compatible filters under clear `AND`/`OR`/`NOT` scope; no implicit population rewrite. |
| 29 | Filter/group rule | Filters a typed ordered field; grouping does not change comparator meaning. |
| 30 | Comparison/ranking boundary | Strict threshold is not `bottom`/`worst`; Category 14 owns ranking population, direction, and ties. |
| 31 | No inference | Do not infer price/fee basis, FX, date event, account timezone, exchange session, ticker alias, or denominator. |
| 32 | No causation/advice | Lower value does not prove edge, cause, quality, forecast, or advice. |
| 33 | Error / unavailable reply | State that strict comparison needs a covered compatible ordered field and explicit basis/threshold. |
| 34 | Do-not-answer | Do not fabricate market/session data, order generic text, or answer with unsafe trading advice. |
| 35 | Cross-category dependency | Categories 2-11 own values; Category 13 owns time grammar; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No parser, market-data lookup, query, or Chat capability is authorized. |
| 37 | Evaluation cases | Strict money boundary, equal-value exclusion, typed quantity, Category 13 time, zero denominator, no-FX, bottom-rank correction. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.6 Canonical: less_than_or_equal

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-006-R1. |
| 02 | Canonical record | `less_than_or_equal`; Section 4 Ordered comparison record. |
| 03 | Display label | Less Than or Equal. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume a validated inclusive comparison. |
| 07 | Intent non-expansion | Does not create ranking, prediction, market screening, recommendation, session lookup, or write intent. |
| 08 | Primary semantic role | Inclusive compatible ordered comparison: field value `<=` explicit operand. |
| 09 | Direct evidence | Accepted current ordered Category 11/metric value and explicit typed operand; truth is derived. |
| 10 | Authorized scope | Server-authorized scope and field eligibility are fixed before the comparison. |
| 11 | Default resolution | Preserve endpoint inclusion; no default unit, currency/basis, date event, session, threshold, or ordered text field. |
| 12 | Accepted literals | `at most`, `no more than`, `X or less`, `up to`. |
| 13 | Realistic variants | `at most $5`, `100 or less shares`, `up to two trades` only with a compatible field and population contract. |
| 14 | Morphology/case | Inclusive wording normalizes only to `<=`; it never becomes strict `<`. |
| 15 | Safe output | Privacy-safe match/count/coverage plus declared inclusive comparator and compatible basis. |
| 16 | Privacy boundary | Never expose raw IDs, private text, hidden account values, or source payloads. |
| 17 | Disallowed identifiers | Client-supplied identity/account IDs, raw broker IDs, internal UUIDs, and untrusted ticker aliases. |
| 18 | Provenance / fact boundary | It compares accepted compatible values only; it does not establish source reliability or trader label truth. |
| 19 | Currency / money boundary | Money comparison needs identical compatible currency and price/fee basis; no FX or display rounding. |
| 20 | Lifecycle coverage | Only eligible lifecycle values compare; open/decision/incomplete rows remain coverage and cannot gain realized metrics. |
| 21 | Unavailable/incomplete coverage | Missing/zero-denominator metric, unknown, incompatible, unresolved, or unauthorized values return unavailable. |
| 22 | Related dimension boundary | Category 11 supplies numeric/money/time operands; Category 13 resolves time endpoint/event semantics before use. |
| 23 | False positives | `bottom trades`, `no more mistakes` without a covered field, generic text sorting, and approximate threshold are not this predicate. |
| 24 | Negation | `not at most` requires grouped boolean scope; unknown does not become strict-greater match. |
| 25 | Correction | If equality must be excluded, use `less_than`; if a two-sided interval is intended, use `range`. |
| 26 | Follow-up | Ask for the one missing field/basis or threshold; do not derive it from ticker, session, or outcome wording. |
| 27 | One-field clarification | “What value and basis should be at most that threshold?” |
| 28 | Combination rule | May combine with compatible filters under clear boolean scope; no default conjunction across ambiguous phrases. |
| 29 | Filter/group rule | Filters a typed ordered field; grouping preserves the same inclusive comparator. |
| 30 | Comparison/ranking boundary | Inclusive threshold is not rank direction or bottom-N; Category 14 owns ranking semantics. |
| 31 | No inference | Do not infer price/fee basis, FX, date event, account timezone, exchange session, ticker alias, or denominator. |
| 32 | No causation/advice | Meeting/below threshold proves no edge, cause, quality, forecast, or advice. |
| 33 | Error / unavailable reply | State that an inclusive comparison needs a covered compatible ordered field and explicit basis/threshold. |
| 34 | Do-not-answer | Do not fabricate market/session data, order generic text, or produce trading advice. |
| 35 | Cross-category dependency | Categories 2-11 own values; Category 13 owns time grammar; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No parser, market-data lookup, query, or Chat capability is authorized. |
| 37 | Evaluation cases | Equal-value inclusion, strict-versus-inclusive correction, money basis, quantity, temporal endpoint, unknown coverage, bottom-rank correction. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.7 Canonical: range

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-007-R1. |
| 02 | Canonical record | `range`; Section 4 Range predicate record. |
| 03 | Display label | Range. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume a validated range. |
| 07 | Intent non-expansion | Does not create a saved bucket, date parser, session lookup, ranking, search, write, or protected-action intent. |
| 08 | Primary semantic role | Test one known covered compatible ordered value against two explicit endpoints with declared lower/upper order and inclusive/exclusive treatment for each endpoint. |
| 09 | Direct evidence | Accepted current Category 11/metric value, two explicit compatible operands, and declared boundary treatment; membership is derived. |
| 10 | Authorized scope | Server-authorized scope and field eligibility are fixed before endpoint evaluation; range cannot discover other evidence. |
| 11 | Default resolution | No bare range default: never assume endpoint inclusivity, reorder endpoints, choose a date event, or resolve an overnight/session rule. |
| 12 | Accepted literals | `between`, `from X to Y`, `within`, `inside`. |
| 13 | Realistic variants | `between $2 and $5`, `from 10:00 to noon`, `within two days` only after the compatible value/bounds and boundary contract are explicit. |
| 14 | Morphology/case | Ordinary interval wording normalizes only to a two-endpoint request; it does not imply inclusive boundaries. |
| 15 | Safe output | Privacy-safe match/count/coverage with both endpoints, order, inclusivity/exclusivity, field type, and compatible basis. |
| 16 | Privacy boundary | Never expose raw IDs, private text, hidden account values, or source payloads while describing a range. |
| 17 | Disallowed identifiers | Client-supplied identity/account IDs, raw broker IDs, internal UUIDs, and untrusted ticker aliases. |
| 18 | Provenance / fact boundary | Range constrains an accepted value only; it does not create a bucket, label, session, provenance fact, or Data Decision resolution. |
| 19 | Currency / money boundary | Money endpoints and field must share compatible currency and price/fee basis; no FX, rounding, or mixed-money interval. |
| 20 | Lifecycle coverage | Range applies only where the owning value is eligible; open/decision/incomplete coverage remains visible and unavailable where required. |
| 21 | Unavailable/incomplete coverage | Missing endpoint, unknown field, incompatible types, reversed order, unresolved decision, or missing temporal contract returns unavailable/clarification, never false. |
| 22 | Related dimension boundary | Category 11 supplies the field; Category 13 exclusively resolves date/time bounds, DST, local calendar, overnight wrapping, and session handling where relevant. |
| 23 | False positives | `cheap stocks`, `price bucket`, `between sessions`, `from AAPL to TSLA`, and a one-ended `between` are not valid range predicates. |
| 24 | Negation | `not between` requires an already validated two-endpoint range and clear grouped boolean scope; it never turns unknown coverage into a match. |
| 25 | Correction | If one side only is intended, use strict/inclusive comparison; if dates/sessions are ambiguous, resolve them through Category 13. |
| 26 | Follow-up | Ask for the one unresolved range contract field—endpoint treatment—after both compatible endpoints are supplied. |
| 27 | One-field clarification | “Should each endpoint be included or excluded?” |
| 28 | Combination rule | May combine only with compatible validated predicates under clear boolean scope; it cannot repair reversed/missing endpoints. |
| 29 | Filter/group rule | Filters one typed ordered field; grouping preserves endpoints and boundary treatment rather than creating buckets. |
| 30 | Comparison/ranking boundary | A range is not top/bottom or ranking; Category 14 owns candidate population, metric direction, tie policy, and rank limits. |
| 31 | No inference | Do not swap endpoints, infer inclusivity, FX, price/fee basis, date event, account timezone, exchange session, overnight rule, ticker alias, or denominator. |
| 32 | No causation/advice | Range membership proves no cause, edge, quality, forecast, or recommendation. |
| 33 | Error / unavailable reply | State that a range needs two compatible ordered endpoints and declared boundary treatment; preserve unavailable coverage. |
| 34 | Do-not-answer | Do not fabricate date/session handling, private values, market data, or unsafe trading advice. |
| 35 | Cross-category dependency | Category 11 owns fields; Category 13 owns all temporal/overnight/session grammar; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No date parser, session calendar, query, range engine, or Chat capability is authorized. |
| 37 | Evaluation cases | Inclusive/exclusive endpoints, equality at each bound, reversed order, one missing bound, mixed currency, DST/overnight time, unknown value, and rank correction. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.8 Canonical: inclusion

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-008-R1. |
| 02 | Canonical record | `inclusion`; Section 4 Set/property predicate record. |
| 03 | Display label | Inclusion. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume validated affirmative inclusion. |
| 07 | Intent non-expansion | Does not create label assignment, note search, setup inference, account lookup, write, or protected-action intent. |
| 08 | Primary semantic role | Require one explicit compatible affirmative property, value, or subset condition on a known covered field. |
| 09 | Direct evidence | Accepted current Category 11 fact/property; truth is derived, and trader-labelled evidence remains explicit/user-labelled where applicable. |
| 10 | Authorized scope | Server authorization fixes evidence before inclusion; wording cannot access a different account, private field, or raw source. |
| 11 | Default resolution | No default label, property, text field, subset, account, or missing-state interpretation. |
| 12 | Accepted literals | `including`, `with`, `tagged`, `having`, `containing`. |
| 13 | Realistic variants | `with this tag`, `having a covered rule result`, `including long trades` only when the referenced field/property is explicit and compatible. |
| 14 | Morphology/case | Ordinary affirmative wording normalizes only after a compatible field/property is known; field values retain owner matching rules. |
| 15 | Safe output | Privacy-safe match/count/coverage and explicit field/property identity; never quote unapproved text or identifiers. |
| 16 | Privacy boundary | Never expose raw labels, private notes, source files, auth subjects, broker identifiers, or hidden account values. |
| 17 | Disallowed identifiers | Client-supplied user/account IDs, raw broker IDs, internal UUIDs, source IDs, and guessed ticker aliases. |
| 18 | Provenance / fact boundary | Inclusion consumes an existing accepted fact only; it cannot assign a setup/tag, infer a note, or declare source quality. |
| 19 | Currency / money boundary | Inclusion does not convert, aggregate, or compare money; any included money field keeps its existing currency/basis contract. |
| 20 | Lifecycle coverage | Applies only where the owned property is eligible/covered; open, decision, and incomplete coverage stays distinct. |
| 21 | Unavailable/incomplete coverage | Missing, unknown, unauthorized, unresolved, or unapproved label/text/property is unavailable, never false or silently excluded. |
| 22 | Related dimension boundary | Category 11 owns explicit properties/labels; `membership` tests finite values and `exclusion` removes a subset. Text content remains `text_search` only with an authorized matcher. |
| 23 | False positives | `with notes`, `contains a mistake`, `tagged AAPL` by guessed alias, `including missing reviews`, and semantic note meaning are not safe inclusion. |
| 24 | Negation | `not with`/`without` requires clear boolean or exclusion semantics; it cannot prove absence of a label, note, or attachment. |
| 25 | Correction | If the request names finite alternatives, use `membership`; if it removes values, use `exclusion`; if it searches content, use `text_search` only when authorized. |
| 26 | Follow-up | Ask for the one referenced property/field when the phrase supplies no explicit compatible target. |
| 27 | One-field clarification | “Which covered field or property should be included?” |
| 28 | Combination rule | May combine with compatible validated predicates under clear boolean scope; never substitutes a label or text match. |
| 29 | Filter/group rule | Filters an explicit affirmative field/property; it does not create a grouping, bucket, or broad label enumeration. |
| 30 | Comparison/ranking boundary | Inclusion may filter a valid population only; Category 14 owns comparison/ranking population, direction, and ties. |
| 31 | No inference | Do not infer setup, strategy, tag, note content, missing state, ticker alias, currency, time/session, or intent from inclusion wording. |
| 32 | No causation/advice | Included property proves no cause, discipline, quality, edge, forecast, or advice. |
| 33 | Error / unavailable reply | State that inclusion needs an explicit covered compatible property/field; preserve unavailable coverage. |
| 34 | Do-not-answer | Do not inspect/quote private text, assign trader labels, reveal identifiers, or fabricate a property. |
| 35 | Cross-category dependency | Category 11 owns fields/labels; Category 13 owns temporal wording; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No label writer, text search, parser, query, or Chat capability is authorized. |
| 37 | Evaluation cases | Explicit tag/property, membership correction, exclusion correction, unauthorized text, missing-state attempt, ticker alias rejection, and scope attempt. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.9 Canonical: exclusion

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-009-R1. |
| 02 | Canonical record | `exclusion`; Section 4 Set/property predicate record. |
| 03 | Display label | Exclusion. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume validated exclusion. |
| 07 | Intent non-expansion | Does not create absence detection, label removal, data repair, account lookup, write, or protected-action intent. |
| 08 | Primary semantic role | Remove an explicit compatible, known/covered subset or property match from an already authorized candidate population. |
| 09 | Direct evidence | Accepted current Category 11 field/property and explicit compatible exclusion condition; removal is derived. |
| 10 | Authorized scope | Server authorization fixes the candidate population first; exclusion cannot reveal, select, or remove another account's evidence. |
| 11 | Default resolution | No default subset, label, text field, negative state, account, or implicit removal rule. |
| 12 | Accepted literals | `excluding`, `without`, `leave out`, `ignore`, `remove`, `do not include`. |
| 13 | Realistic variants | `excluding this tag`, `leave out long trades`, `without this covered source` only when a compatible field/property is explicit. |
| 14 | Morphology/case | Ordinary removal wording normalizes only after a compatible explicit predicate/set is known; field-value matching keeps its owner contract. |
| 15 | Safe output | Privacy-safe retained/excluded counts and unavailable coverage; never list hidden excluded values. |
| 16 | Privacy boundary | Never expose raw labels, private notes, source files, auth subjects, broker identifiers, or hidden account values. |
| 17 | Disallowed identifiers | Client-supplied user/account IDs, raw broker IDs, internal UUIDs, source IDs, and guessed ticker aliases. |
| 18 | Provenance / fact boundary | Exclusion filters existing accepted facts; it cannot delete evidence, resolve a Data Decision, prove a label/note is absent, or judge provenance quality. |
| 19 | Currency / money boundary | Exclusion does not convert or combine money; an excluded money predicate retains its owning compatible currency/basis contract. |
| 20 | Lifecycle coverage | May remove rows only where its owned condition is covered; open/decision/incomplete unknown coverage remains visible rather than silently excluded. |
| 21 | Unavailable/incomplete coverage | Missing, unknown, unauthorized, unresolved, or unapproved property/set is unavailable, never an exclusion match or proof of absence. |
| 22 | Related dimension boundary | Category 11 owns properties; `inequality` compares one known value, `membership` tests a finite set, and covered negative-state dimensions remain separate facts. |
| 23 | False positives | `without notes`, `not reviewed`, `remove bad trades`, `exclude unknown direction`, and `without AAPL` by guessed ticker alias are not safe generic exclusion. |
| 24 | Negation | `not excluding` and nested `NOT` require clear grouped boolean scope; negation never turns unknown or missing evidence into inclusion. |
| 25 | Correction | If the request tests one value, use `inequality`; if it tests alternatives, use `membership`; if it asks for a negative field, require that covered field. |
| 26 | Follow-up | Ask for the one explicit field/property or subset to remove when the request does not provide a compatible target. |
| 27 | One-field clarification | “Which covered field, property, or value should be excluded?” |
| 28 | Combination rule | May combine with compatible validated predicates under clear boolean scope; cannot rewrite source precedence or candidate eligibility. |
| 29 | Filter/group rule | Filters an authorized population by explicit condition; it does not create a group, a negative label, or a broad enumeration. |
| 30 | Comparison/ranking boundary | Exclusion may filter a valid population only; Category 14 owns comparison/ranking population, direction, ties, and limits. |
| 31 | No inference | Do not infer missing notes, labels, reviews, attachments, ticker aliases, currency, session, date, or trader intent. |
| 32 | No causation/advice | Excluding a subset proves no cause, quality, discipline, edge, forecast, or advice. |
| 33 | Error / unavailable reply | State that exclusion needs an explicit covered compatible condition; preserve unavailable coverage. |
| 34 | Do-not-answer | Do not delete evidence, reveal excluded private values, invent negative states, or provide unsafe trading advice. |
| 35 | Cross-category dependency | Category 11 owns fields/negative states; Category 13 owns temporal wording; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No deletion, label writer, parser, query, or Chat capability is authorized. |
| 37 | Evaluation cases | Explicit property exclusion, inequality correction, missing-note attempt, unknown value, nested-not ambiguity, ticker-alias rejection, and scope attempt. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.10 Canonical: membership

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-010-R1. |
| 02 | Canonical record | `membership`; Section 4 Set predicate record. |
| 03 | Display label | Membership. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume validated membership. |
| 07 | Intent non-expansion | Does not create list management, ticker discovery, label assignment, search, account lookup, write, or protected-action intent. |
| 08 | Primary semantic role | Test whether one known, covered compatible field value belongs to one finite explicit typed set. |
| 09 | Direct evidence | Accepted current Category 11 field value plus explicit compatible set members; truth is derived. |
| 10 | Authorized scope | Server authorization selects evidence before testing; membership cannot enumerate values or broaden account/workspace scope. |
| 11 | Default resolution | No default set, field, element coercion, unit, currency/basis, date/session, or ticker alias expansion. |
| 12 | Accepted literals | `one of`, `either`, `any of`, `in this list`. |
| 13 | Realistic variants | `one of these tags`, `either long or short`, `any of these currencies` only with an explicit compatible finite set. |
| 14 | Morphology/case | Set members use the owning field's documented exact/case rule; normalize only safe operator wording, deduplicate equal compatible members before evaluation, and never broaden case variants by guess. |
| 15 | Safe output | Privacy-safe match/count/coverage and declared finite set cardinality/type; never disclose hidden unmatched values or raw identifiers. |
| 16 | Privacy boundary | Never use membership to reveal private labels, note text, source material, auth subjects, broker IDs, or hidden accounts. |
| 17 | Disallowed identifiers | Client-supplied user/account IDs, raw broker IDs, internal UUIDs, source IDs, and untrusted ticker aliases. |
| 18 | Provenance / fact boundary | Membership tests covered values only; it cannot create a provenance fact, trader label, source quality claim, or Data Decision resolution. |
| 19 | Currency / money boundary | Money members require the same compatible currency and basis as the field; no FX, mixed-currency set, rounding, or display-value coercion. |
| 20 | Lifecycle coverage | Only eligible lifecycle values test membership; open/decision/incomplete/unknown values remain coverage and cannot match by omission. |
| 21 | Unavailable/incomplete coverage | Empty set, unknown field, incompatible member, unauthorized fact, unresolved decision, or missing temporal contract is unavailable/clarification, never false. |
| 22 | Related dimension boundary | Category 11 owns field values including ticker; equality tests one value, inclusion tests affirmative property, exclusion removes subset, and range tests ordered endpoints. |
| 23 | False positives | `all tickers`, `anything like AAPL`, `one of my accounts` by ID, `any note mentioning`, a deduced ticker alias, and open-ended set language are not valid membership. |
| 24 | Negation | `not one of` requires a validated finite set and clear grouped boolean scope; unknown does not become a nonmember. |
| 25 | Correction | If one value is intended, use `equality`; if ordered endpoints are intended, use `range`; if text content is intended, use authorized `text_search`. |
| 26 | Follow-up | Ask for the one missing explicit finite set when a compatible field is already known. |
| 27 | One-field clarification | “Which finite set of compatible values should I use?” |
| 28 | Combination rule | May combine with compatible validated predicates under clear boolean scope; every member must pass type/unit/currency/time compatibility before union. |
| 29 | Filter/group rule | Filters one typed field against a finite deduplicated set; it does not group, rank, or enumerate a broader domain. |
| 30 | Comparison/ranking boundary | Membership may filter a valid population only; Category 14 owns comparison/ranking population, direction, ties, and limits. |
| 31 | No inference | Do not infer set members, ticker aliases, case variants, units, FX, date/session rules, labels, or missing values. |
| 32 | No causation/advice | Membership proves no cause, quality, discipline, edge, forecast, or advice. |
| 33 | Error / unavailable reply | State that membership needs a known covered field and finite explicit compatible values; preserve unavailable coverage. |
| 34 | Do-not-answer | Do not discover/list private values, guess ticker aliases, coerce mixed money, or provide unsafe trading advice. |
| 35 | Cross-category dependency | Category 11 owns values; Category 13 resolves temporal members; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No list manager, ticker lookup, parser, query, or Chat capability is authorized. |
| 37 | Evaluation cases | Enum set, duplicate members, case-rule preservation, mixed currency rejection, unknown field, ticker-alias rejection, temporal member, and scope attempt. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

## 6.11 Canonical: text_search

| # | Required registry subsection | Draft registry value |
|---:|---|---|
| 01 | Registry ID | C12-OP-011-R1. |
| 02 | Canonical record | `text_search`; Section 4 Text predicate record. |
| 03 | Display label | Text Search. |
| 04 | Inventory capability status | Planned; matches the controlling inventory. |
| 05 | Registry state | Approved and locked; Version 1; lead-controller approval 2026-08-11. |
| 06 | Locked Category 1 intent binding | Only `intent_retrieve_records`, `intent_summarize_performance`, `intent_calculate_metric`, `intent_compare_groups`, `intent_group_and_aggregate`, and `intent_rank_results` may consume a separately authorized validated text predicate. |
| 07 | Intent non-expansion | Does not create semantic retrieval, note inspection, source-file access, identity lookup, diagnosis, write, or protected-action intent. |
| 08 | Primary semantic role | Test one explicitly authorized, covered, privacy-safe text field against an explicit query under a documented matcher/version and documented case/token rules. |
| 09 | Direct evidence | Authorized covered text-field existence plus explicit query; a documented matcher produces derived match status without exposing content. |
| 10 | Authorized scope | Server authorization and text-field access policy are fixed before matching; text search cannot cross accounts or access hidden/raw evidence. |
| 11 | Default resolution | No default text field, matcher, matcher version, case folding, tokenization, stemming, substring, fuzzy match, semantic expansion, or source access. |
| 12 | Accepted literals | `notes mention`, `contains`, `says`, `includes the words`. |
| 13 | Realistic variants | `notes mention risk`, `contains this exact term`, `says stop loss` only after an authorized field and documented matcher are selected. |
| 14 | Morphology/case | Apply only the authorized matcher/version's documented case and token rule; do not add stemming, synonym, fuzzy, substring, semantic, or ticker-alias expansion. |
| 15 | Safe output | Privacy-safe match/count/coverage plus authorized field identity and matcher/version; never return matched raw text by default. |
| 16 | Privacy boundary | Never inspect, quote, expose, summarize, or infer from raw private notes, source files, statement text, auth subjects, identifiers, or hidden metadata. |
| 17 | Disallowed identifiers | Raw note/source text, filenames, statement identifiers, auth/account/broker IDs, internal UUIDs, tokens, and client-supplied private-field selectors. |
| 18 | Provenance / fact boundary | A text match is not proof of setup, strategy, emotion, intent, plan, review, cause, source quality, or Data Decision outcome. |
| 19 | Currency / money boundary | Text matching neither parses nor converts money; quoted numeric text is not a typed financial operand without its owning contract. |
| 20 | Lifecycle coverage | Only covered authorized text fields can be considered for a lifecycle; absent/unavailable text remains coverage, not non-match. |
| 21 | Unavailable/incomplete coverage | Missing authorization, field, matcher/version, documented case/token rule, or complete coverage returns unavailable; never silently falls back to raw/fuzzy search. |
| 22 | Related dimension boundary | Category 11 owns note/label presence facts; `inclusion` uses explicit property, `membership` uses finite values, and text content is not a label or ticker alias. |
| 23 | False positives | `find similar notes`, `what was I feeling`, `notes prove I broke rules`, raw source search, fuzzy match, semantic match, and ticker discovery are not this predicate. |
| 24 | Negation | `does not contain` requires an authorized matcher and complete coverage; missing/unavailable text never proves a negative match. |
| 25 | Correction | If the request targets an explicit label/property, use inclusion/membership; if it asks for meaning or diagnosis, do not convert a text match into that claim. |
| 26 | Follow-up | Ask for the one authorized text field when the request does not identify a covered searchable field. |
| 27 | One-field clarification | “Which authorized text field should I search?” |
| 28 | Combination rule | May combine only with compatible validated predicates under clear boolean scope; it cannot widen text access or alter matcher rules. |
| 29 | Filter/group rule | Filters an authorized documented match result only; it does not group raw content, return snippets, or create semantic clusters. |
| 30 | Comparison/ranking boundary | Text matches may filter a valid population only; Category 14 owns comparison/ranking and cannot rank private text relevance by default. |
| 31 | No inference | Do not infer text meaning, sentiment, causation, labels, ticker aliases, intent, case/token behavior, matcher version, or absent text. |
| 32 | No causation/advice | A match proves no cause, discipline, edge, forecast, psychological state, or trading advice. |
| 33 | Error / unavailable reply | State that the requested authorized searchable field or documented matcher is unavailable without disclosing content. |
| 34 | Do-not-answer | Do not search raw/private/source text, disclose snippets, fabricate fuzzy/semantic matches, or diagnose/advice from text. |
| 35 | Cross-category dependency | Category 11 owns covered field facts; Category 13 owns temporal wording; Category 14 owns ranking; Category 19 owns privacy/policy. |
| 36 | Runtime boundary | No full-text index, matcher, note API, source reader, query, or Chat capability is authorized. |
| 37 | Evaluation cases | Authorized exact matcher, case/token rule, missing matcher/version, missing field, no-fuzzy rejection, negated complete coverage, raw-text request, and scope attempt. |
| 38 | Lock / approval | Approved and locked Version 1 by lead controller on 2026-08-11. |

---

# 7. Evaluation Cases Deliverable

Controller approval recorded: all 11 Section 6 registries and all 242
evaluation cases passed independent review and are locked in Version 1. This
does not authorize runtime capability.

## Evaluation Array `C12-E1` -- `equality`

```json
[
    {
        "caseId":  "C12-E1-01",
        "caseType":  "canonical",
        "input":  "Show covered trades where ticker is NVDA.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker exactly NVDA"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "covered ticker identity"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Ticker equality is exact and account-scoped."
    },
    {
        "caseId":  "C12-E1-02",
        "caseType":  "formal_paraphrase",
        "input":  "Retrieve accepted records whose instrument type equals Stock.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type exactly Stock"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted current facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Enum equality does not coerce a related label."
    },
    {
        "caseId":  "C12-E1-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Which covered trades with an accepted first-opening allocation price in USD and USD were exactly at $25.00? Use the accepted first-opening allocation price in USD and USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "entry price equals exact 25.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact money equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No rounding or FX conversion."
    },
    {
        "caseId":  "C12-E1-04",
        "caseType":  "trader_slang",
        "input":  "Pull the AAPL-only book.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker exactly AAPL"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact ticker equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "authorized scope",
                                            "ticker identity"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Slang does not broaden ticker aliases."
    },
    {
        "caseId":  "C12-E1-05",
        "caseType":  "abbreviation",
        "input":  "Show EQ records for TSLA.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "operator wording needs clarification"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Do you mean exact equality?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "EQ has no direct mapping; ask one clarification question."
    },
    {
        "caseId":  "C12-E1-06",
        "caseType":  "misspelling",
        "input":  "Show trades where the tickr is AMD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker exactly AMD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ticker identity",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Clear spelling normalization does not invent a ticker."
    },
    {
        "caseId":  "C12-E1-07",
        "caseType":  "noisy_input",
        "input":  "nvda only pls covered",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker exactly NVDA"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "authorized scope",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Noise cannot add a date or account."
    },
    {
        "caseId":  "C12-E1-08",
        "caseType":  "command",
        "input":  "List accepted executions whose currency is CAD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "known covered currency exactly CAD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact enum equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted facts",
                                            "currency coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Currency filtering does not convert values."
    },
    {
        "caseId":  "C12-E1-09",
        "caseType":  "fragment",
        "input":  "Exchange equals NASDAQ.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "exchange"
                                      ],
        "expectedFilters":  [
                                "known covered exchange exactly NASDAQ"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact enum equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "exchange evidence",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No exchange is guessed from ticker."
    },
    {
        "caseId":  "C12-E1-10",
        "caseType":  "follow_up",
        "input":  "Keep only the ones equal to the same selected ticker.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "prior trusted selected ticker exactly"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reuse exact equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "prior trusted ticker context",
        "expectedContextRequirements":  [
                                            "trusted prior context",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Only trusted prior ticker context may be reused."
    },
    {
        "caseId":  "C12-E1-11",
        "caseType":  "correction",
        "input":  "I meant exactly 100 shares, not approximately 100. Use accepted Stock execution share quantity, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "known covered size equals exact integer 100"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact numeric equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Approximate equality is not substituted."
    },
    {
        "caseId":  "C12-E1-12",
        "caseType":  "comparison",
        "input":  "Compare NVDA and AMD by explicit ready_closed trade count.",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "ticker exactly NVDA",
                                "ticker exactly AMD",
                                "ready_closed"
                            ],
        "expectedGroupings":  [
                                  "ticker"
                              ],
        "expectedOperators":  [
                                  "compare ready_closed trade counts"
                              ],
        "expectedComparison":  {
                                   "left":  "NVDA",
                                   "right":  "AMD",
                                   "basis":  "ready_closed trade count"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ready_closed trade count",
                                            "same authorized scope",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Category 14 owns comparison population semantics."
    },
    {
        "caseId":  "C12-E1-13",
        "caseType":  "ranking",
        "input":  "Rank the covered records where ticker is MSFT by the stated metric.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker exactly MSFT"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact equality before ranking"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 14 candidate population",
                                            "metric direction",
                                            "tie policy",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Equality filters; it does not define ranking."
    },
    {
        "caseId":  "C12-E1-14",
        "caseType":  "negation",
        "input":  "Show known covered trades whose ticker is not NVDA.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "inequality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "exclude exact NVDA value"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "typed inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "known covered ticker",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Unknown ticker values never match through negation."
    },
    {
        "caseId":  "C12-E1-15",
        "caseType":  "exclusion",
        "input":  "Exclude covered records whose account is the trusted selected paper account.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "account"
                                      ],
        "expectedFilters":  [
                                "trusted selected authorized account",
                                "exclude exact account"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact equality exclusion"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized paper account",
        "expectedContextRequirements":  [
                                            "server authorization",
                                            "trusted account context",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Never accepts a raw account identifier."
    },
    {
        "caseId":  "C12-E1-16",
        "caseType":  "multi_filter",
        "input":  "Show ready-closed NVDA trades where currency is USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker",
                                          "currency",
                                          "closed"
                                      ],
        "expectedFilters":  [
                                "ticker exactly NVDA",
                                "currency exactly USD",
                                "ready_closed"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "AND exact equality filters"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "authorized scope",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Adjacent compatible filters compose with AND."
    },
    {
        "caseId":  "C12-E1-17",
        "caseType":  "multi_part",
        "input":  "Show exact-USD NVDA records and report open or decision coverage separately.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "ticker exactly NVDA",
                                "currency exactly USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact equality",
                                  "separate coverage"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "lifecycle coverage",
                                            "authorized scope"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Open and decision coverage is not silently filtered into results."
    },
    {
        "caseId":  "C12-E1-18",
        "caseType":  "ambiguous",
        "input":  "Show trades with price equal to 25.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "entry_price"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "price field and currency/basis"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which price field, currency, and price basis should equal 25?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Ask one focused operand question; do not default currency or basis."
    },
    {
        "caseId":  "C12-E1-19",
        "caseType":  "negative_example",
        "input":  "Treat an unknown exchange as equal to NASDAQ.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "exchange"
                                      ],
        "expectedFilters":  [
                                "unknown exchange"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "do not equate unknown"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "known covered exchange required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Unknown or unavailable evidence cannot satisfy equality.",
        "notes":  "Return unavailable coverage."
    },
    {
        "caseId":  "C12-E1-20",
        "caseType":  "unsupported_data",
        "input":  "Show trades where broker account number equals 987654.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "account"
                                      ],
        "expectedFilters":  [
                                "raw broker account identifier"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject private identifier selection"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server authorization",
                                            "privacy policy"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Raw broker account identifiers are not authorized query operands.",
        "notes":  "No identifier lookup or existence disclosure."
    },
    {
        "caseId":  "C12-E1-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected trade, show fields equal to its selected ticker.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "trusted selected trade ticker exactly"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reuse trusted exact value"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized trade",
        "expectedContextRequirements":  [
                                            "trusted selection",
                                            "server authorization",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Selection is opaque and authorization-bound."
    },
    {
        "caseId":  "C12-E1-22",
        "caseType":  "cross_category",
        "input":  "Explain covered gross P/L where the reporting currency equals USD.",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "equality",
                                          "currency",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "currency exactly USD",
                                "metric eligibility"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact currency equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 2 gross P/L contract",
                                            "same currency partition",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Equality does not create FX or change P/L basis."
    }
]
```

## Evaluation Array `C12-E2` -- `inequality`

```json
[
    {
        "caseId":  "C12-E2-01",
        "caseType":  "canonical",
        "input":  "Show covered trades where ticker is not NVDA.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "not exact NVDA"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "authorized scope",
                                            "known covered ticker"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Unknown ticker values do not match."
    },
    {
        "caseId":  "C12-E2-02",
        "caseType":  "formal_paraphrase",
        "input":  "Retrieve accepted executions whose currency does not equal CAD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "known covered currency",
                                "not exact CAD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact enum inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted facts",
                                            "currency coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Filtering does not convert currency."
    },
    {
        "caseId":  "C12-E2-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Which covered trades with an accepted first-opening allocation price in USD and USD had a price other than $12.50? Use the accepted first-opening allocation price in USD and USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "not exact 12.50 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact money inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No FX or rounded comparison."
    },
    {
        "caseId":  "C12-E2-04",
        "caseType":  "trader_slang",
        "input":  "Pull the book, but not the TSLA names.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "exclude exact TSLA"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact ticker inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ticker identity",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No ticker-alias expansion."
    },
    {
        "caseId":  "C12-E2-05",
        "caseType":  "abbreviation",
        "input":  "Show NEQ QQQ entries.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "ticker"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "operator wording needs clarification"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Do you mean exact inequality?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "NEQ has no direct mapping; ask one clarification question."
    },
    {
        "caseId":  "C12-E2-06",
        "caseType":  "misspelling",
        "input":  "Show trades where the currncy isnt USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "known covered currency",
                                "not exact USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact enum inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "currency coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Spelling normalization preserves typed semantics."
    },
    {
        "caseId":  "C12-E2-07",
        "caseType":  "noisy_input",
        "input":  "not amd trades covered pls",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "not exact AMD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "authorized scope",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Noise cannot make missing values nonmatches."
    },
    {
        "caseId":  "C12-E2-08",
        "caseType":  "command",
        "input":  "List records whose instrument type is not Option.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "not exact Option"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact enum inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Unknown type remains coverage."
    },
    {
        "caseId":  "C12-E2-09",
        "caseType":  "fragment",
        "input":  "Not the selected account.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "account"
                                      ],
        "expectedFilters":  [
                                "trusted selected authorized account",
                                "exclude exact account"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact contextual inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized account",
        "expectedContextRequirements":  [
                                            "server authorization",
                                            "trusted context"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No raw account identifier is accepted."
    },
    {
        "caseId":  "C12-E2-10",
        "caseType":  "follow_up",
        "input":  "Now exclude that same trusted selected exchange.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "exchange"
                                      ],
        "expectedFilters":  [
                                "prior trusted selected exchange",
                                "not exact exchange"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reuse exact inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "prior trusted exchange context",
        "expectedContextRequirements":  [
                                            "trusted prior context",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Follow-up cannot discover exchange values."
    },
    {
        "caseId":  "C12-E2-11",
        "caseType":  "correction",
        "input":  "I meant values not equal to 50 shares, not values under 50. Use accepted Stock execution share quantity, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "known covered size",
                                "not exact integer 50"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact numeric inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Inequality is not a threshold."
    },
    {
        "caseId":  "C12-E2-12",
        "caseType":  "comparison",
        "input":  "Compare USD and known non-USD currency groups by ready_closed trade count.",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "currency exactly USD",
                                "known covered currency not USD",
                                "ready_closed"
                            ],
        "expectedGroupings":  [
                                  "currency partition"
                              ],
        "expectedOperators":  [
                                  "compare ready_closed trade counts"
                              ],
        "expectedComparison":  {
                                   "left":  "USD",
                                   "right":  "known non-USD currency groups",
                                   "basis":  "ready_closed trade count"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ready_closed trade count",
                                            "currency grouping",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Comparison must preserve currency partitions."
    },
    {
        "caseId":  "C12-E2-13",
        "caseType":  "ranking",
        "input":  "Rank covered trades not equal to the selected ticker by the stated metric.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "not trusted selected ticker"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact inequality before ranking"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected ticker context",
        "expectedContextRequirements":  [
                                            "Category 14 ranking contract",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Inequality does not define rank direction or ties."
    },
    {
        "caseId":  "C12-E2-14",
        "caseType":  "negation",
        "input":  "Show known covered records that do not have instrument type Forex.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "not exact Forex"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "typed inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "known covered field"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Do not infer a type when it is missing."
    },
    {
        "caseId":  "C12-E2-15",
        "caseType":  "exclusion",
        "input":  "Exclude known covered records whose ticker is not SPY.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "inequality set not SPY"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit inequality exclusion"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "clear boolean scope",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "This retains only known SPY values; unknown remains coverage."
    },
    {
        "caseId":  "C12-E2-16",
        "caseType":  "multi_filter",
        "input":  "Show ready-closed trades not equal to NVDA and with currency not equal to CAD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "ticker",
                                          "currency",
                                          "closed"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "known ticker not NVDA",
                                "known currency not CAD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "AND typed inequalities"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "known covered fields",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Neither missing field passes by negation."
    },
    {
        "caseId":  "C12-E2-17",
        "caseType":  "multi_part",
        "input":  "Show non-USD covered records and separately report unknown-currency coverage.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "known covered currency not USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "typed inequality",
                                  "separate coverage"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "unknown coverage visibility"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Unknown values are reported, not matched."
    },
    {
        "caseId":  "C12-E2-18",
        "caseType":  "ambiguous",
        "input":  "Show trades not equal to 30.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "field and compatible unit/basis"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which field and compatible unit, currency, or basis should not equal 30?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Ask one operand question; never choose a numeric field."
    },
    {
        "caseId":  "C12-E2-19",
        "caseType":  "negative_example",
        "input":  "Count unknown ticker values as not equal to NVDA.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "unknown ticker"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "do not negate unknown"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "known covered ticker required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Unknown or unavailable values cannot satisfy inequality by negation.",
        "notes":  "Return unavailable coverage."
    },
    {
        "caseId":  "C12-E2-20",
        "caseType":  "unsupported_data",
        "input":  "Exclude every record whose private source filename is not statement.pdf.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality"
                                      ],
        "expectedFilters":  [
                                "raw private source filename"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject private source comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "privacy policy"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Raw private source metadata is not an authorized predicate field.",
        "notes":  "No source browsing or filename disclosure."
    },
    {
        "caseId":  "C12-E2-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected execution, find known values not equal to its currency.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "trusted selected execution currency",
                                "known currency not exact selected value"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reuse trusted typed value"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized execution",
        "expectedContextRequirements":  [
                                            "trusted selection",
                                            "currency coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Selection does not allow FX conversion."
    },
    {
        "caseId":  "C12-E2-22",
        "caseType":  "cross_category",
        "input":  "Explain gross P/L for ready-closed records whose reporting currency is not CAD.",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "inequality",
                                          "currency",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "known reporting currency not CAD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact currency inequality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 2 P/L contract",
                                            "currency partition",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No FX or metric eligibility change."
    }
]
```

## Evaluation Array `C12-E3` -- `greater_than`

```json
[
    {
        "caseId":  "C12-E3-01",
        "caseType":  "canonical",
        "input":  "Show covered trades with size greater than 100 shares. Use accepted Stock execution share quantity, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "known covered size",
                                "strictly greater than 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict numeric greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "100 does not match."
    },
    {
        "caseId":  "C12-E3-02",
        "caseType":  "formal_paraphrase",
        "input":  "Retrieve accepted records whose covered entry price is strictly above 20.00 USD. Use the accepted first-opening allocation price in USD and USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "known covered entry price",
                                "strictly greater than 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict money greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No FX or inclusive substitution."
    },
    {
        "caseId":  "C12-E3-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Which covered entries happened after the trusted selected instant?",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "exact_date"
                                      ],
        "expectedFilters":  [
                                "known covered event instant",
                                "strictly after trusted instant"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict temporal greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected time context",
        "expectedContextRequirements":  [
                                            "Category 13 resolved temporal semantics",
                                            "raw UTC",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No browser-clock default."
    },
    {
        "caseId":  "C12-E3-04",
        "caseType":  "trader_slang",
        "input":  "Pull the heavy-size trades over 200 shares. Use accepted Stock execution share quantity, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "known covered size",
                                "strictly greater than 200 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict numeric greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Slang does not define a bucket."
    },
    {
        "caseId":  "C12-E3-05",
        "caseType":  "abbreviation",
        "input":  "Show qty \u003e 75 for covered executions. Use accepted Stock execution share quantity, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "known covered quantity",
                                "strictly greater than 75"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict numeric greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Abbreviation preserves strictness."
    },
    {
        "caseId":  "C12-E3-06",
        "caseType":  "misspelling",
        "input":  "Show entries greter than 15.25 USD. Use the accepted first-opening allocation price in USD and USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "known covered entry price",
                                "strictly greater than 15.25 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict money greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Spelling normalization adds no FX."
    },
    {
        "caseId":  "C12-E3-07",
        "caseType":  "noisy_input",
        "input":  "size over 30 pls covered Use accepted Stock execution share quantity, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "known covered size",
                                "strictly greater than 30"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Noise changes no unit."
    },
    {
        "caseId":  "C12-E3-08",
        "caseType":  "command",
        "input":  "List covered executions later than 2026-08-01T14:30:00Z.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "exact_date"
                                      ],
        "expectedFilters":  [
                                "known covered execution instant",
                                "strictly after supplied instant"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict temporal greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "resolved timestamp",
                                            "raw UTC",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "The endpoint itself does not match."
    },
    {
        "caseId":  "C12-E3-09",
        "caseType":  "fragment",
        "input":  "Above $40.00 USD entry price. Use the accepted first-opening allocation price in USD and USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "known covered entry price",
                                "strictly greater than 40.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict money greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Entry price basis is explicit."
    },
    {
        "caseId":  "C12-E3-10",
        "caseType":  "follow_up",
        "input":  "Keep the same trusted price basis and use strictly over 18.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "prior trusted price basis",
                                "known price strictly greater than 18.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reuse strict money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "prior trusted price-basis context",
        "expectedContextRequirements":  [
                                            "trusted prior context",
                                            "same currency",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Follow-up cannot change basis."
    },
    {
        "caseId":  "C12-E3-11",
        "caseType":  "correction",
        "input":  "I meant strictly after the close, not at or after it.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "exact_date"
                                      ],
        "expectedFilters":  [
                                "known covered event instant",
                                "strictly after trusted close instant"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict temporal greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected close-time context",
        "expectedContextRequirements":  [
                                            "Category 13 boundary resolution",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Do not replace \u003e with \u003e=."
    },
    {
        "caseId":  "C12-E3-12",
        "caseType":  "comparison",
        "input":  "Compare counts of accepted Stock executions above 100 shares with counts above 25 shares, using accepted execution-share quantity.",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity strictly greater than 100 shares",
                                "quantity strictly greater than 25 shares"
                            ],
        "expectedGroupings":  [
                                  "threshold population"
                              ],
        "expectedOperators":  [
                                  "strict numeric thresholds",
                                  "compare accepted Stock execution counts"
                              ],
        "expectedComparison":  {
                                   "left":  "accepted Stock executions above 100 shares",
                                   "right":  "accepted Stock executions above 25 shares",
                                   "basis":  "accepted Stock execution count"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "accepted Stock execution count",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Category 14 owns comparison presentation."
    },
    {
        "caseId":  "C12-E3-13",
        "caseType":  "ranking",
        "input":  "Rank accepted Stock executions with execution share quantity greater than 100 shares by execution share quantity, largest-first, retaining ties.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "threshold strictly greater than 100",
                                "multiplier 1",
                                "unit shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "rank by execution share quantity",
                                  "largest-first",
                                  "retain ties"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "threshold 100 shares",
                                            "unit shares",
                                            "multiplier 1",
                                            "ranking metric execution share quantity",
                                            "direction largest-first",
                                            "tie policy retain ties",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Threshold is not rank semantics."
    },
    {
        "caseId":  "C12-E3-14",
        "caseType":  "negation",
        "input":  "Show known covered sizes not greater than 80 shares. Use accepted Stock execution share quantity, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "known covered size",
                                "not strictly greater than 80"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "typed negation with clear scope"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Unknown size does not satisfy negation."
    },
    {
        "caseId":  "C12-E3-15",
        "caseType":  "exclusion",
        "input":  "Exclude known covered entries strictly after the trusted cutoff instant.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "exact_date"
                                      ],
        "expectedFilters":  [
                                "known covered event instant",
                                "exclude values strictly after trusted cutoff"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict temporal exclusion"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted cutoff-time context",
        "expectedContextRequirements":  [
                                            "Category 13 temporal resolution",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Missing time remains coverage."
    },
    {
        "caseId":  "C12-E3-16",
        "caseType":  "multi_filter",
        "input":  "Show ready-closed NVDA trades with size above 50 shares. Use accepted Stock execution share quantity, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "size",
                                          "ticker",
                                          "closed"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "ready_closed",
                                "ticker exactly NVDA",
                                "size strictly greater than 50"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "AND strict typed comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "All filters remain compatible."
    },
    {
        "caseId":  "C12-E3-17",
        "caseType":  "multi_part",
        "input":  "Show covered entries strictly after the explicit trusted cutoff 2026-08-05T15:00:00Z and separately report missing-time coverage.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "exact_date"
                                      ],
        "expectedFilters":  [
                                "known event instant strictly after explicit trusted cutoff 2026-08-05T15:00:00Z"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict temporal comparison",
                                  "separate coverage"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "resolved explicit trusted cutoff 2026-08-05T15:00:00Z",
                                            "time coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Missing timestamps are not treated as later."
    },
    {
        "caseId":  "C12-E3-18",
        "caseType":  "ambiguous",
        "input":  "Show trades over 20.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ordered field and compatible unit/currency/basis"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which ordered field and compatible unit, currency, or time basis should be over 20?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Ask one typed-operand question."
    },
    {
        "caseId":  "C12-E3-19",
        "caseType":  "negative_example",
        "input":  "Treat ticker names alphabetically after NVDA as greater than NVDA.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "text ticker ordering"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject text ordering"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ordered numeric, money, or temporal type required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Strict greater-than is unavailable for arbitrary text or labels.",
        "notes":  "Do not impose lexical order."
    },
    {
        "caseId":  "C12-E3-20",
        "caseType":  "unsupported_data",
        "input":  "Show gross P/L greater than 100 after silently converting every currency to USD.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "implicit FX request"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject implicit conversion"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "same currency and metric basis required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Greater-than cannot create an FX conversion or mixed-currency comparison.",
        "notes":  "Preserve currency partitions."
    },
    {
        "caseId":  "C12-E3-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected execution, show covered sizes greater than its quantity.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "trusted selected quantity",
                                "known covered size strictly greater"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reuse trusted numeric operand"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized execution",
        "expectedContextRequirements":  [
                                            "trusted selection",
                                            "same quantity unit",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No raw execution identifier is exposed."
    },
    {
        "caseId":  "C12-E3-22",
        "caseType":  "cross_category",
        "input":  "Explain covered gross P/L strictly greater than 500.00 USD for ready-closed trades.",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than",
                                          "gross_pnl",
                                          "closed"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "known gross P/L strictly greater than 500.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strict money greater-than"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 2 gross P/L eligibility",
                                            "same currency",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Operator cannot change P/L formula or eligibility."
    }
]
```

## Evaluation Array `C12-E4` -- `greater_than_or_equal`
```json
[
    {
        "caseId":  "C12-E4-01",
        "caseType":  "canonical",
        "input":  "Show known covered accepted Stock execution quantities in share unit multiplier 1 at least 100 shares. In the authorized Journal scope for this canonical request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003e= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-02",
        "caseType":  "formal_paraphrase",
        "input":  "Retrieve accepted records whose accepted first-opening allocation price in USD is at least 20.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "price \u003e= 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Show entry events at least the explicit trusted UTC cutoff 2026-08-05T15:00:00Z. In the authorized Journal scope for this conversational paraphrase request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "exact_date"
                                      ],
        "expectedFilters":  [
                                "known covered event instant",
                                "at least explicit trusted UTC cutoff 2026-08-05T15:00:00Z"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least temporal comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 13 resolved time semantics",
                                            "raw UTC",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-04",
        "caseType":  "trader_slang",
        "input":  "Pull accepted Stock share-unit multiplier-1 size at least 100 shares. In the authorized Journal scope for this trader slang request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003e= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-05",
        "caseType":  "abbreviation",
        "input":  "Show accepted Stock sh qty \u003e= 100 (multiplier 1). In the authorized Journal scope for this abbreviation request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003e= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-06",
        "caseType":  "misspelling",
        "input":  "Show accepted Stock execution share quanitty at least 100 shares, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003e= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Genuine misspelling preserves the concrete typed quantity operand."
    },
    {
        "caseId":  "C12-E4-07",
        "caseType":  "noisy_input",
        "input":  "covered stock share qty \u003e= 100 mult1 pls In the authorized Journal scope for this noisy input request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003e= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-08",
        "caseType":  "command",
        "input":  "List records whose accepted first-opening allocation price in USD is at least 20.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "price \u003e= 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-09",
        "caseType":  "fragment",
        "input":  "Accepted first-opening allocation prices in USD at least 20.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "price \u003e= 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Fragment retains the complete concrete price operand."
    },
    {
        "caseId":  "C12-E4-10",
        "caseType":  "follow_up",
        "input":  "Keep the trusted prior accepted first-opening allocation price in USD, threshold at least 20.00 USD, and selected authorized account scope.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "trusted prior accepted first-opening allocation price in USD",
                                "trusted prior threshold \u003e= 20.00 USD",
                                "trusted selected authorized account scope"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized account and prior price-threshold context",
        "expectedContextRequirements":  [
                                            "trusted prior operand",
                                            "trusted prior threshold",
                                            "accepted first-opening allocation price in USD",
                                            "trusted authorized scope",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Follow-up reuses only trusted prior operand, threshold, basis, and scope."
    },
    {
        "caseId":  "C12-E4-11",
        "caseType":  "correction",
        "input":  "I correct the prior trusted selected quantity assertion: use at least 100 shares, not the prior opposite comparator.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "trusted prior selected quantity context",
                                "corrected quantity \u003e= 100 shares",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least temporal comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior selected execution-quantity context",
        "expectedContextRequirements":  [
                                            "trusted prior selected context",
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Correction explicitly replaces a trusted prior comparator and threshold assertion."
    },
    {
        "caseId":  "C12-E4-12",
        "caseType":  "comparison",
        "input":  "Compare accepted Stock share-unit multiplier-1 execution quantities at least 100 shares with at least 25 shares using the same compatible execution-count basis. In the authorized Journal scope for this comparison request.",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "same exact execution quantity basis",
                                "quantity \u003e= 100 shares",
                                "quantity \u003e= 25 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least typed numeric comparison"
                              ],
        "expectedComparison":  {
                                   "left":  "\u003e= 100 shares",
                                   "right":  "\u003e= 25 shares",
                                   "basis":  "same compatible execution-count basis"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 14 comparison contract",
                                            "accepted Stock share unit with multiplier 1",
                                            "same exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-13",
        "caseType":  "ranking",
        "input":  "Rank the top 10 accepted Stock executions with execution share quantity \u003e= 100 shares, multiplier 1, unit shares, largest-first, retaining ties at the boundary.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003e= 100 shares",
                                "top 10 limit"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "ranking metric execution share quantity",
                                  "direction largest-first",
                                  "limit top 10",
                                  "retain ties at boundary"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "threshold \u003e= 100 shares",
                                            "ranking metric execution share quantity",
                                            "direction largest-first",
                                            "limit top 10",
                                            "tie policy retain ties at boundary",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Complete bounded ranking keeps ties at the top-10 boundary."
    },
    {
        "caseId":  "C12-E4-14",
        "caseType":  "negation",
        "input":  "Show known covered accepted Stock share-unit multiplier-1 quantities not satisfying \u003e= 100 shares. In the authorized Journal scope for this negation request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003e= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "typed negation with clear scope"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Unknown quantity does not satisfy negation."
    },
    {
        "caseId":  "C12-E4-15",
        "caseType":  "exclusion",
        "input":  "Exclude known covered accepted Stock execution records failing the at least 100-share predicate; retain only its typed complement.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "known covered accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "exclude records failing quantity \u003e= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclude complement of typed predicate",
                                  "retain known covered quantity \u003e= 100 shares"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "known covered accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "True exclusion removes the known covered complement; unknown quantity remains coverage."
    },
    {
        "caseId":  "C12-E4-16",
        "caseType":  "multi_filter",
        "input":  "Show ready-closed NVDA trades with accepted Stock share-unit multiplier-1 execution quantity at least 100 shares. In the authorized Journal scope for this multi filter request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "ticker exactly NVDA",
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "quantity \u003e= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-17",
        "caseType":  "multi_part",
        "input":  "Show ready-closed NVDA trades with accepted first-opening allocation price in USD at least 20.00 USD and accepted Stock execution share quantity \u003e= 100 shares, multiplier 1, unit shares; report both coverage states.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "entry_price",
                                          "size",
                                          "ticker",
                                          "closed"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "ticker exactly NVDA",
                                "accepted first-opening allocation price in USD",
                                "price \u003e= 20.00 USD",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003e= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least money predicate",
                                  "at least quantity predicate",
                                  "AND compatible predicates",
                                  "report both coverage states"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage for both predicates"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Two explicit compatible predicates remain distinct and coverage-aware."
    },
    {
        "caseId":  "C12-E4-18",
        "caseType":  "ambiguous",
        "input":  "Show trades at least 100. In the authorized Journal scope for this ambiguous request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "operator"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ordered field and compatible unit, currency, or time basis"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which ordered field and compatible unit, currency, or time basis should be at least 100?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Ask one focused typed-operand question."
    },
    {
        "caseId":  "C12-E4-19",
        "caseType":  "negative_example",
        "input":  "Treat ticker labels at least NVDA as valid ordered comparison. In the authorized Journal scope for this negative example request.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "text label ordering"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject text ordering"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ordered numeric, money, or temporal type required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Ordered comparisons are unavailable for arbitrary text or labels.",
        "notes":  "No lexical ordering."
    },
    {
        "caseId":  "C12-E4-20",
        "caseType":  "unsupported_data",
        "input":  "Show gross P/L at least 100 after silently converting every currency to USD. In the authorized Journal scope for this unsupported data request.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "implicit FX request"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject implicit FX"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "same currency and metric basis required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "An operator cannot create FX conversion or a mixed-currency comparison.",
        "notes":  "Preserve currency partitions."
    },
    {
        "caseId":  "C12-E4-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected execution, show accepted Stock share-unit multiplier-1 quantities at least its exact execution quantity. In the authorized Journal scope for this selected entity context request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "trusted selected execution quantity",
                                "accepted Stock share unit with multiplier 1",
                                "same exact execution quantity basis",
                                "quantity \u003e= selected quantity"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reuse trusted numeric operand"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized execution",
        "expectedContextRequirements":  [
                                            "trusted selection",
                                            "same share unit and exact quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003e= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E4-22",
        "caseType":  "cross_category",
        "input":  "Explain covered gross P/L at least 100.00 USD for ready-closed trades in the same compatible USD partition. In the authorized Journal scope for this cross category request.",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "greater_than_or_equal",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "known gross P/L \u003e= 100.00 USD",
                                "same compatible USD partition"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at least money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 2 gross P/L eligibility",
                                            "same compatible USD currency",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Operator cannot change P/L formula or eligibility."
    }
]
```

## Evaluation Array `C12-E5` -- `less_than`
```json
[
    {
        "caseId":  "C12-E5-01",
        "caseType":  "canonical",
        "input":  "Show known covered accepted Stock execution quantities in share unit multiplier 1 strictly below 100 shares. In the authorized Journal scope for this canonical request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-02",
        "caseType":  "formal_paraphrase",
        "input":  "Retrieve accepted records whose accepted first-opening allocation price in USD is strictly below 20.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "price \u003c 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Show entry events strictly below the explicit trusted UTC cutoff 2026-08-05T15:00:00Z. In the authorized Journal scope for this conversational paraphrase request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "exact_date"
                                      ],
        "expectedFilters":  [
                                "known covered event instant",
                                "strictly below explicit trusted UTC cutoff 2026-08-05T15:00:00Z"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below temporal comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 13 resolved time semantics",
                                            "raw UTC",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-04",
        "caseType":  "trader_slang",
        "input":  "Pull accepted Stock share-unit multiplier-1 size strictly below 100 shares. In the authorized Journal scope for this trader slang request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-05",
        "caseType":  "abbreviation",
        "input":  "Show accepted Stock sh qty \u003c 100 (multiplier 1). In the authorized Journal scope for this abbreviation request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-06",
        "caseType":  "misspelling",
        "input":  "Show accepted Stock execution share quanitty strictly below 100 shares, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003c 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Genuine misspelling preserves the concrete typed quantity operand."
    },
    {
        "caseId":  "C12-E5-07",
        "caseType":  "noisy_input",
        "input":  "covered stock share qty \u003c 100 mult1 pls In the authorized Journal scope for this noisy input request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-08",
        "caseType":  "command",
        "input":  "List records whose accepted first-opening allocation price in USD is strictly below 20.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "price \u003c 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-09",
        "caseType":  "fragment",
        "input":  "Accepted first-opening allocation prices in USD strictly below 20.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "price \u003c 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Fragment retains the complete concrete price operand."
    },
    {
        "caseId":  "C12-E5-10",
        "caseType":  "follow_up",
        "input":  "Keep the trusted prior accepted first-opening allocation price in USD, threshold strictly below 20.00 USD, and selected authorized account scope.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "trusted prior accepted first-opening allocation price in USD",
                                "trusted prior threshold \u003c 20.00 USD",
                                "trusted selected authorized account scope"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized account and prior price-threshold context",
        "expectedContextRequirements":  [
                                            "trusted prior operand",
                                            "trusted prior threshold",
                                            "accepted first-opening allocation price in USD",
                                            "trusted authorized scope",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Follow-up reuses only trusted prior operand, threshold, basis, and scope."
    },
    {
        "caseId":  "C12-E5-11",
        "caseType":  "correction",
        "input":  "I correct the prior trusted selected quantity assertion: use strictly below 100 shares, not the prior opposite comparator.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "trusted prior selected quantity context",
                                "corrected quantity \u003c 100 shares",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below temporal comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior selected execution-quantity context",
        "expectedContextRequirements":  [
                                            "trusted prior selected context",
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Correction explicitly replaces a trusted prior comparator and threshold assertion."
    },
    {
        "caseId":  "C12-E5-12",
        "caseType":  "comparison",
        "input":  "Compare accepted Stock share-unit multiplier-1 execution quantities strictly below 100 shares with strictly below 25 shares using the same compatible execution-count basis. In the authorized Journal scope for this comparison request.",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "same exact execution quantity basis",
                                "quantity \u003c 100 shares",
                                "quantity \u003c 25 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below typed numeric comparison"
                              ],
        "expectedComparison":  {
                                   "left":  "\u003c 100 shares",
                                   "right":  "\u003c 25 shares",
                                   "basis":  "same compatible execution-count basis"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 14 comparison contract",
                                            "accepted Stock share unit with multiplier 1",
                                            "same exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-13",
        "caseType":  "ranking",
        "input":  "Rank the top 10 accepted Stock executions with execution share quantity \u003c 100 shares, multiplier 1, unit shares, largest-first, retaining ties at the boundary.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003c 100 shares",
                                "top 10 limit"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "ranking metric execution share quantity",
                                  "direction largest-first",
                                  "limit top 10",
                                  "retain ties at boundary"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "threshold \u003c 100 shares",
                                            "ranking metric execution share quantity",
                                            "direction largest-first",
                                            "limit top 10",
                                            "tie policy retain ties at boundary",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Complete bounded ranking keeps ties at the top-10 boundary."
    },
    {
        "caseId":  "C12-E5-14",
        "caseType":  "negation",
        "input":  "Show known covered accepted Stock share-unit multiplier-1 quantities not satisfying \u003c 100 shares. In the authorized Journal scope for this negation request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "typed negation with clear scope"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Unknown quantity does not satisfy negation."
    },
    {
        "caseId":  "C12-E5-15",
        "caseType":  "exclusion",
        "input":  "Exclude known covered accepted Stock execution records failing the strictly below 100-share predicate; retain only its typed complement.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "known covered accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "exclude records failing quantity \u003c 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclude complement of typed predicate",
                                  "retain known covered quantity \u003c 100 shares"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "known covered accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "True exclusion removes the known covered complement; unknown quantity remains coverage."
    },
    {
        "caseId":  "C12-E5-16",
        "caseType":  "multi_filter",
        "input":  "Show ready-closed NVDA trades with accepted Stock share-unit multiplier-1 execution quantity strictly below 100 shares. In the authorized Journal scope for this multi filter request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "ticker exactly NVDA",
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "quantity \u003c 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-17",
        "caseType":  "multi_part",
        "input":  "Show ready-closed NVDA trades with accepted first-opening allocation price in USD strictly below 20.00 USD and accepted Stock execution share quantity \u003c 100 shares, multiplier 1, unit shares; report both coverage states.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "entry_price",
                                          "size",
                                          "ticker",
                                          "closed"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "ticker exactly NVDA",
                                "accepted first-opening allocation price in USD",
                                "price \u003c 20.00 USD",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003c 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below money predicate",
                                  "strictly below quantity predicate",
                                  "AND compatible predicates",
                                  "report both coverage states"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage for both predicates"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Two explicit compatible predicates remain distinct and coverage-aware."
    },
    {
        "caseId":  "C12-E5-18",
        "caseType":  "ambiguous",
        "input":  "Show trades strictly below 100. In the authorized Journal scope for this ambiguous request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "operator"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ordered field and compatible unit, currency, or time basis"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which ordered field and compatible unit, currency, or time basis should be strictly below 100?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Ask one focused typed-operand question."
    },
    {
        "caseId":  "C12-E5-19",
        "caseType":  "negative_example",
        "input":  "Treat ticker labels strictly below NVDA as valid ordered comparison. In the authorized Journal scope for this negative example request.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "text label ordering"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject text ordering"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ordered numeric, money, or temporal type required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Ordered comparisons are unavailable for arbitrary text or labels.",
        "notes":  "No lexical ordering."
    },
    {
        "caseId":  "C12-E5-20",
        "caseType":  "unsupported_data",
        "input":  "Show gross P/L strictly below 100 after silently converting every currency to USD. In the authorized Journal scope for this unsupported data request.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "implicit FX request"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject implicit FX"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "same currency and metric basis required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "An operator cannot create FX conversion or a mixed-currency comparison.",
        "notes":  "Preserve currency partitions."
    },
    {
        "caseId":  "C12-E5-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected execution, show accepted Stock share-unit multiplier-1 quantities strictly below its exact execution quantity. In the authorized Journal scope for this selected entity context request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "trusted selected execution quantity",
                                "accepted Stock share unit with multiplier 1",
                                "same exact execution quantity basis",
                                "quantity \u003c selected quantity"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reuse trusted numeric operand"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized execution",
        "expectedContextRequirements":  [
                                            "trusted selection",
                                            "same share unit and exact quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E5-22",
        "caseType":  "cross_category",
        "input":  "Explain covered gross P/L strictly below 100.00 USD for ready-closed trades in the same compatible USD partition. In the authorized Journal scope for this cross category request.",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "known gross P/L \u003c 100.00 USD",
                                "same compatible USD partition"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "strictly below money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 2 gross P/L eligibility",
                                            "same compatible USD currency",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Operator cannot change P/L formula or eligibility."
    }
]
```

## Evaluation Array `C12-E6` -- `less_than_or_equal`
```json
[
    {
        "caseId":  "C12-E6-01",
        "caseType":  "canonical",
        "input":  "Show known covered accepted Stock execution quantities in share unit multiplier 1 at most 100 shares. In the authorized Journal scope for this canonical request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-02",
        "caseType":  "formal_paraphrase",
        "input":  "Retrieve accepted records whose accepted first-opening allocation price in USD is at most 20.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "price \u003c= 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Show entry events at most the explicit trusted UTC cutoff 2026-08-05T15:00:00Z. In the authorized Journal scope for this conversational paraphrase request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "exact_date"
                                      ],
        "expectedFilters":  [
                                "known covered event instant",
                                "at most explicit trusted UTC cutoff 2026-08-05T15:00:00Z"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most temporal comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 13 resolved time semantics",
                                            "raw UTC",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-04",
        "caseType":  "trader_slang",
        "input":  "Pull accepted Stock share-unit multiplier-1 size at most 100 shares. In the authorized Journal scope for this trader slang request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-05",
        "caseType":  "abbreviation",
        "input":  "Show accepted Stock sh qty \u003c= 100 (multiplier 1). In the authorized Journal scope for this abbreviation request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-06",
        "caseType":  "misspelling",
        "input":  "Show accepted Stock execution share quanitty at most 100 shares, multiplier 1, unit shares.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003c= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Genuine misspelling preserves the concrete typed quantity operand."
    },
    {
        "caseId":  "C12-E6-07",
        "caseType":  "noisy_input",
        "input":  "covered stock share qty \u003c= 100 mult1 pls In the authorized Journal scope for this noisy input request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-08",
        "caseType":  "command",
        "input":  "List records whose accepted first-opening allocation price in USD is at most 20.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "price \u003c= 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-09",
        "caseType":  "fragment",
        "input":  "Accepted first-opening allocation prices in USD at most 20.00 USD.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "price \u003c= 20.00 USD"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "exact decimal",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Fragment retains the complete concrete price operand."
    },
    {
        "caseId":  "C12-E6-10",
        "caseType":  "follow_up",
        "input":  "Keep the trusted prior accepted first-opening allocation price in USD, threshold at most 20.00 USD, and selected authorized account scope.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "trusted prior accepted first-opening allocation price in USD",
                                "trusted prior threshold \u003c= 20.00 USD",
                                "trusted selected authorized account scope"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized account and prior price-threshold context",
        "expectedContextRequirements":  [
                                            "trusted prior operand",
                                            "trusted prior threshold",
                                            "accepted first-opening allocation price in USD",
                                            "trusted authorized scope",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Follow-up reuses only trusted prior operand, threshold, basis, and scope."
    },
    {
        "caseId":  "C12-E6-11",
        "caseType":  "correction",
        "input":  "I correct the prior trusted selected quantity assertion: use at most 100 shares, not the prior opposite comparator.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "trusted prior selected quantity context",
                                "corrected quantity \u003c= 100 shares",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most temporal comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior selected execution-quantity context",
        "expectedContextRequirements":  [
                                            "trusted prior selected context",
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Correction explicitly replaces a trusted prior comparator and threshold assertion."
    },
    {
        "caseId":  "C12-E6-12",
        "caseType":  "comparison",
        "input":  "Compare accepted Stock share-unit multiplier-1 execution quantities at most 100 shares with at most 25 shares using the same compatible execution-count basis. In the authorized Journal scope for this comparison request.",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "same exact execution quantity basis",
                                "quantity \u003c= 100 shares",
                                "quantity \u003c= 25 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most typed numeric comparison"
                              ],
        "expectedComparison":  {
                                   "left":  "\u003c= 100 shares",
                                   "right":  "\u003c= 25 shares",
                                   "basis":  "same compatible execution-count basis"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 14 comparison contract",
                                            "accepted Stock share unit with multiplier 1",
                                            "same exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-13",
        "caseType":  "ranking",
        "input":  "Rank the top 10 accepted Stock executions with execution share quantity \u003c= 100 shares, multiplier 1, unit shares, largest-first, retaining ties at the boundary.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003c= 100 shares",
                                "top 10 limit"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "ranking metric execution share quantity",
                                  "direction largest-first",
                                  "limit top 10",
                                  "retain ties at boundary"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "threshold \u003c= 100 shares",
                                            "ranking metric execution share quantity",
                                            "direction largest-first",
                                            "limit top 10",
                                            "tie policy retain ties at boundary",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Complete bounded ranking keeps ties at the top-10 boundary."
    },
    {
        "caseId":  "C12-E6-14",
        "caseType":  "negation",
        "input":  "Show known covered accepted Stock share-unit multiplier-1 quantities not satisfying \u003c= 100 shares. In the authorized Journal scope for this negation request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "known covered quantity \u003c= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "typed negation with clear scope"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Unknown quantity does not satisfy negation."
    },
    {
        "caseId":  "C12-E6-15",
        "caseType":  "exclusion",
        "input":  "Exclude known covered accepted Stock execution records failing the at most 100-share predicate; retain only its typed complement.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "known covered accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "exclude records failing quantity \u003c= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclude complement of typed predicate",
                                  "retain known covered quantity \u003c= 100 shares"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "known covered accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "True exclusion removes the known covered complement; unknown quantity remains coverage."
    },
    {
        "caseId":  "C12-E6-16",
        "caseType":  "multi_filter",
        "input":  "Show ready-closed NVDA trades with accepted Stock share-unit multiplier-1 execution quantity at most 100 shares. In the authorized Journal scope for this multi filter request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "ticker exactly NVDA",
                                "accepted Stock share unit with multiplier 1",
                                "exact execution quantity basis",
                                "quantity \u003c= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most typed numeric comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "accepted Stock share unit with multiplier 1",
                                            "exact execution quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-17",
        "caseType":  "multi_part",
        "input":  "Show ready-closed NVDA trades with accepted first-opening allocation price in USD at most 20.00 USD and accepted Stock execution share quantity \u003c= 100 shares, multiplier 1, unit shares; report both coverage states.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "entry_price",
                                          "size",
                                          "ticker",
                                          "closed"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "ticker exactly NVDA",
                                "accepted first-opening allocation price in USD",
                                "price \u003c= 20.00 USD",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003c= 100 shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most money predicate",
                                  "at most quantity predicate",
                                  "AND compatible predicates",
                                  "report both coverage states"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "accepted first-opening allocation price in USD",
                                            "accepted Stock execution share quantity",
                                            "multiplier 1",
                                            "unit shares",
                                            "coverage for both predicates"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Two explicit compatible predicates remain distinct and coverage-aware."
    },
    {
        "caseId":  "C12-E6-18",
        "caseType":  "ambiguous",
        "input":  "Show trades at most 100. In the authorized Journal scope for this ambiguous request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "operator"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ordered field and compatible unit, currency, or time basis"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which ordered field and compatible unit, currency, or time basis should be at most 100?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Ask one focused typed-operand question."
    },
    {
        "caseId":  "C12-E6-19",
        "caseType":  "negative_example",
        "input":  "Treat ticker labels at most NVDA as valid ordered comparison. In the authorized Journal scope for this negative example request.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "text label ordering"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject text ordering"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "ordered numeric, money, or temporal type required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Ordered comparisons are unavailable for arbitrary text or labels.",
        "notes":  "No lexical ordering."
    },
    {
        "caseId":  "C12-E6-20",
        "caseType":  "unsupported_data",
        "input":  "Show gross P/L at most 100 after silently converting every currency to USD. In the authorized Journal scope for this unsupported data request.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "implicit FX request"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject implicit FX"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "same currency and metric basis required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "An operator cannot create FX conversion or a mixed-currency comparison.",
        "notes":  "Preserve currency partitions."
    },
    {
        "caseId":  "C12-E6-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected execution, show accepted Stock share-unit multiplier-1 quantities at most its exact execution quantity. In the authorized Journal scope for this selected entity context request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "trusted selected execution quantity",
                                "accepted Stock share unit with multiplier 1",
                                "same exact execution quantity basis",
                                "quantity \u003c= selected quantity"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reuse trusted numeric operand"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized execution",
        "expectedContextRequirements":  [
                                            "trusted selection",
                                            "same share unit and exact quantity basis",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "\u003c= applies only to known covered compatible numeric, money, or temporal values."
    },
    {
        "caseId":  "C12-E6-22",
        "caseType":  "cross_category",
        "input":  "Explain covered gross P/L at most 100.00 USD for ready-closed trades in the same compatible USD partition. In the authorized Journal scope for this cross category request.",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "less_than_or_equal",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "known gross P/L \u003c= 100.00 USD",
                                "same compatible USD partition"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "at most money comparison"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 2 gross P/L eligibility",
                                            "same compatible USD currency",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Operator cannot change P/L formula or eligibility."
    }
]
```
## Evaluation Array `C12-E7` -- `range`
```json
[
    {
        "caseId":  "C12-E7-01",
        "caseType":  "canonical",
        "input":  "Show known covered accepted first-opening allocation prices in USD from 10.00 inclusive to 20.00 exclusive; lower endpoint \u003c= upper endpoint.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-02",
        "caseType":  "formal_paraphrase",
        "input":  "Retrieve accepted records using first-opening USD price endpoints 10.00 inclusive and 20.00 exclusive, declared lower \u003c= upper.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Which of my covered trades had first-opening USD prices from 10 inclusive up to but excluding 20?",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-04",
        "caseType":  "trader_slang",
        "input":  "Pull the 10-to-20 first-opening USD price slice, include 10 and leave out 20.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-05",
        "caseType":  "abbreviation",
        "input":  "Rng first-open USD 10i to 20e, lower \u003c= upper.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-06",
        "caseType":  "misspelling",
        "input":  "Show frist-opening USD prices betwen 10 inclusive and 20 exclusive with lower \u003c= upper.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-07",
        "caseType":  "noisy_input",
        "input":  "first open usd 10 inc 20 exc covered pls",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-08",
        "caseType":  "command",
        "input":  "List covered first-opening USD prices from 10.00 inclusive through 20.00 exclusive.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-09",
        "caseType":  "fragment",
        "input":  "First-opening USD price: [10 inclusive, 20 exclusive).",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-10",
        "caseType":  "follow_up",
        "input":  "Keep the trusted prior first-opening USD range [10 inclusive,20 exclusive) in the selected authorized account.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior authorized range context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-11",
        "caseType":  "correction",
        "input":  "I meant the trusted prior lower 10 inclusive and upper 20 exclusive range, not both inclusive.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior range context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-12",
        "caseType":  "comparison",
        "input":  "Compare ready_closed trade count for first-opening USD [10,20) versus [20,30).",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper",
                                "ready_closed"
                            ],
        "expectedGroupings":  [
                                  "explicit subset"
                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  {
                                   "left":  "first explicit subset",
                                   "right":  "second explicit subset",
                                   "basis":  "ready_closed trade count"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-13",
        "caseType":  "ranking",
        "input":  "Rank top 10 accepted Stock execution share quantities [100 inclusive,200 exclusive), multiplier 1/unit shares, largest-first retaining ties.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "lower 100 inclusive",
                                "upper 200 exclusive",
                                "top 10"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "rank by execution share quantity",
                                  "largest-first",
                                  "retain ties at boundary"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-14",
        "caseType":  "negation",
        "input":  "Show known covered values outside grouped [10 inclusive,20 exclusive) range.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "covered typed field must be selected",
                                            "later compatible unit, currency, or time basis required",
                                            "two explicit ordered endpoints and endpoint inclusivity required"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which covered typed field should the range apply to?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Staged clarification does not assume a price, currency, time, or range selection."
    },
    {
        "caseId":  "C12-E7-15",
        "caseType":  "exclusion",
        "input":  "Exclude known covered Stock execution quantities outside [100 inclusive,200 exclusive) shares, multiplier 1.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "known covered accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "lower endpoint 100 shares inclusive",
                                "upper endpoint 200 shares exclusive",
                                "range [100,200) shares"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "range explicit complement/subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-16",
        "caseType":  "multi_filter",
        "input":  "Show ready-closed NVDA trades with first-opening USD [10,20) AND ticker equality.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper",
                                "ready_closed",
                                "ticker exactly NVDA"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range",
                                  "AND clear scope"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-17",
        "caseType":  "multi_part",
        "input":  "Show first-opening USD [10,20) AND Stock share quantity [100,200), multiplier 1/unit shares; report both coverage.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price",
                                          "size",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper",
                                "known covered USD currency"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range",
                                  "two explicit compatible predicates",
                                  "AND clear scope",
                                  "report both coverage"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-18",
        "caseType":  "ambiguous",
        "input":  "Show prices between 10 and 20.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which field, unit/currency/basis, and inclusive/exclusive endpoints should the range use?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-19",
        "caseType":  "negative_example",
        "input":  "Automatically swap lower 20 USD and upper 10 USD endpoints.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "invalid or unknown evidence"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject inference"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Reversed range endpoints must not be reordered.",
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-20",
        "caseType":  "unsupported_data",
        "input":  "Use an overnight range without an approved session definition.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "unauthorized or missing contract"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject unsafe fallback"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "This request lacks an authorized typed field or boundary.",
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected range, show covered first-opening USD price membership.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E7-22",
        "caseType":  "cross_category",
        "input":  "Explain gross P/L for ready-closed trades whose first-opening USD price is [10,20).",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "range",
                                          "entry_price",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "accepted first-opening allocation price in USD",
                                "lower 10.00 USD inclusive",
                                "upper 20.00 USD exclusive",
                                "declared lower \u003c= upper",
                                "ready_closed"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit typed two-endpoint range",
                                  "filters metric population"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage",
                                            "Category 2 gross P/L contract"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    }
]
```

## Evaluation Array `C12-E8` -- `inclusion`
```json
[
    {
        "caseId":  "C12-E8-01",
        "caseType":  "canonical",
        "input":  "Include known covered records whose instrument type is Stock.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-02",
        "caseType":  "formal_paraphrase",
        "input":  "Include accepted records with the explicit known covered instrument type Stock.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Which of my covered records should include the Stock subset?",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-04",
        "caseType":  "trader_slang",
        "input":  "Include the known Stock-only book.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-05",
        "caseType":  "abbreviation",
        "input":  "Include inst-type Stock from covered records.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-06",
        "caseType":  "misspelling",
        "input":  "Include known covred Stock instrument records.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-07",
        "caseType":  "noisy_input",
        "input":  "include Stock covered pls",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-08",
        "caseType":  "command",
        "input":  "Include every known covered record with instrument type Stock.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-09",
        "caseType":  "fragment",
        "input":  "Include: instrument type Stock.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-10",
        "caseType":  "follow_up",
        "input":  "Keep the trusted prior selected Stock subset include filter in the authorized account.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior authorized Stock-subset context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-11",
        "caseType":  "correction",
        "input":  "I meant includeing known covered Stock records, not unknown instrument types.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior subset context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-12",
        "caseType":  "comparison",
        "input":  "Compare ready_closed trade count for included Stock subset versus known covered non-Stock subset.",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset",
                                "ready_closed"
                            ],
        "expectedGroupings":  [
                                  "explicit subset"
                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  {
                                   "left":  "first explicit subset",
                                   "right":  "second explicit subset",
                                   "basis":  "ready_closed trade count"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-13",
        "caseType":  "ranking",
        "input":  "Rank top 10 included known covered Stock executions by execution share quantity, largest-first, retaining boundary ties.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "known covered Stock subset",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "top 10"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit subset",
                                  "rank by execution share quantity",
                                  "largest-first",
                                  "retain ties at boundary"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-14",
        "caseType":  "negation",
        "input":  "Include known covered records not matching explicit Stock subset only with grouped boolean scope.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "grouped negation; unknown never matches"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-15",
        "caseType":  "exclusion",
        "input":  "Include known covered ticker NVDA subset; never prove a missing ticker.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "known covered ticker NVDA subset",
                                "explicit inclusion of known covered NVDA ticker",
                                "explicit AND scope"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "AND inclusion with ticker equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-16",
        "caseType":  "multi_filter",
        "input":  "Include ready-closed NVDA Stock records with explicit AND scope.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset",
                                "ready_closed",
                                "ticker exactly NVDA"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset",
                                  "AND clear scope"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-17",
        "caseType":  "multi_part",
        "input":  "Include known covered Stock AND known covered USD subset; report both coverage.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset",
                                "known covered USD currency"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset",
                                  "two explicit compatible predicates",
                                  "AND clear scope",
                                  "report both coverage"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-18",
        "caseType":  "ambiguous",
        "input":  "Include records with tag winner.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which known covered compatible field and explicit value should be included or excluded?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-19",
        "caseType":  "negative_example",
        "input":  "Treat a missing instrument type as included in Stock.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "invalid or unknown evidence"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject inference"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Missing or unknown evidence cannot satisfy an affirmative or exclusion predicate.",
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-20",
        "caseType":  "unsupported_data",
        "input":  "Include records by searching raw private notes for a word.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "unauthorized or missing contract"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject unsafe fallback"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "This request lacks an authorized typed field or boundary.",
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected authorized Stock subset, include only known covered records.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E8-22",
        "caseType":  "cross_category",
        "input":  "Explain gross P/L for ready-closed records after includeing explicit known covered Stock subset.",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "inclusion",
                                          "instrument_type",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset",
                                "ready_closed"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "inclusion explicit compatible subset",
                                  "filters metric population"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage",
                                            "Category 2 gross P/L contract"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    }
]
```

## Evaluation Array `C12-E9` -- `exclusion`
```json
[
    {
        "caseId":  "C12-E9-01",
        "caseType":  "canonical",
        "input":  "Exclude known covered records whose instrument type is Stock.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-02",
        "caseType":  "formal_paraphrase",
        "input":  "Exclude accepted records with the explicit known covered instrument type Stock.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Which of my covered records should exclude the Stock subset?",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-04",
        "caseType":  "trader_slang",
        "input":  "Exclude the known Stock-only book.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-05",
        "caseType":  "abbreviation",
        "input":  "Exclude inst-type Stock from covered records.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-06",
        "caseType":  "misspelling",
        "input":  "Exclude known covred Stock instrument records.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-07",
        "caseType":  "noisy_input",
        "input":  "exclude Stock covered pls",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-08",
        "caseType":  "command",
        "input":  "Exclude every known covered record with instrument type Stock.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-09",
        "caseType":  "fragment",
        "input":  "Exclude: instrument type Stock.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-10",
        "caseType":  "follow_up",
        "input":  "Keep the trusted prior selected Stock subset exclude filter in the authorized account.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior authorized Stock-subset context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-11",
        "caseType":  "correction",
        "input":  "I meant excludeing known covered Stock records, not unknown instrument types.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior subset context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-12",
        "caseType":  "comparison",
        "input":  "Compare ready_closed trade count for excluded Stock subset versus known covered non-Stock subset.",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset",
                                "ready_closed"
                            ],
        "expectedGroupings":  [
                                  "explicit subset"
                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  {
                                   "left":  "first explicit subset",
                                   "right":  "second explicit subset",
                                   "basis":  "ready_closed trade count"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-13",
        "caseType":  "ranking",
        "input":  "Rank top 10 excluded known covered Stock executions by execution share quantity, largest-first, retaining boundary ties.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "known covered Stock subset",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "top 10"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit subset",
                                  "rank by execution share quantity",
                                  "largest-first",
                                  "retain ties at boundary"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-14",
        "caseType":  "negation",
        "input":  "Exclude known covered records not matching explicit Stock subset only with grouped boolean scope.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "grouped negation; unknown never matches"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-15",
        "caseType":  "exclusion",
        "input":  "Exclude known covered ticker NVDA subset; never prove a missing ticker.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "ready_closed",
                                "known covered ticker NVDA subset",
                                "explicit exclusion of known covered NVDA ticker",
                                "explicit AND scope"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "AND exclusion with ticker equality"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-16",
        "caseType":  "multi_filter",
        "input":  "Exclude ready-closed NVDA Stock records with explicit AND scope.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset",
                                "ready_closed",
                                "ticker exactly NVDA"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset",
                                  "AND clear scope"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-17",
        "caseType":  "multi_part",
        "input":  "Exclude known covered Stock AND known covered USD subset; report both coverage.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type",
                                          "currency"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset",
                                "known covered USD currency"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset",
                                  "two explicit compatible predicates",
                                  "AND clear scope",
                                  "report both coverage"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-18",
        "caseType":  "ambiguous",
        "input":  "Exclude records with tag winner.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which known covered compatible field and explicit value should be included or excluded?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-19",
        "caseType":  "negative_example",
        "input":  "Treat a missing instrument type as excluded from Stock.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "invalid or unknown evidence"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject inference"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Missing or unknown evidence cannot satisfy an affirmative or exclusion predicate.",
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-20",
        "caseType":  "unsupported_data",
        "input":  "Exclude records by searching raw private notes for a word.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "unauthorized or missing contract"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject unsafe fallback"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "This request lacks an authorized typed field or boundary.",
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected authorized Stock subset, exclude only known covered records.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    },
    {
        "caseId":  "C12-E9-22",
        "caseType":  "cross_category",
        "input":  "Explain gross P/L for ready-closed records after excludeing explicit known covered Stock subset.",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "exclusion",
                                          "instrument_type",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "known covered instrument_type",
                                "explicit Stock subset",
                                "ready_closed"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exclusion explicit compatible subset",
                                  "filters metric population"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage",
                                            "Category 2 gross P/L contract"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Use known covered facts only; do not infer missing, unknown, or private evidence."
    }
]
```
## Evaluation Array `C12-E10` -- `membership`
```json
[
    {
        "caseId":  "C12-E10-01",
        "caseType":  "canonical",
        "input":  "Show known covered records whose ticker is one of the explicit deduplicated set [AAPL, NVDA, MSFT]. For the canonical request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-02",
        "caseType":  "formal_paraphrase",
        "input":  "Retrieve accepted records whose known covered ticker belongs to the finite explicit deduplicated set [AAPL,NVDA,MSFT].",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Which of my covered trades had ticker AAPL, NVDA, or MSFT from that exact set?",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-04",
        "caseType":  "trader_slang",
        "input":  "Pull my covered AAPL-NVDA-MSFT basket only.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-05",
        "caseType":  "abbreviation",
        "input":  "Show tkr-set members AAPL/NVDA/MSFT from covered records.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-06",
        "caseType":  "misspelling",
        "input":  "Show known covered tickrs in explicit deduped set [AAPL, NVDA, MSFT].",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-07",
        "caseType":  "noisy_input",
        "input":  "Show covered tickr-set members AAPL, NVDA, or MSFT.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-08",
        "caseType":  "command",
        "input":  "Show known covered records whose ticker is one of the explicit deduplicated set [AAPL, NVDA, MSFT]. For the command request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-09",
        "caseType":  "fragment",
        "input":  "Tickers in explicit set [AAPL, NVDA, MSFT].",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-10",
        "caseType":  "follow_up",
        "input":  "Keep the trusted prior finite deduplicated ticker set [AAPL, NVDA, MSFT] in the selected authorized account.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior authorized predicate context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-11",
        "caseType":  "correction",
        "input":  "I meant the corrected finite explicit deduplicated ticker set [AMD,INTC], not the prior set.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "corrected finite explicit deduplicated set [AMD,INTC]",
                                "field-owned ticker case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership in corrected set [AMD,INTC]"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior predicate context",
        "expectedContextRequirements":  [
                                            "trusted prior predicate context",
                                            "known covered comparable ticker",
                                            "finite explicit deduplicated set [AMD,INTC]",
                                            "field-owned case rule",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-12",
        "caseType":  "comparison",
        "input":  "Compare ready_closed trade count for exact ticker set [AAPL,NVDA] versus exact ticker set [MSFT].",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "exact finite deduplicated set [AAPL,NVDA]",
                                "exact finite deduplicated set [MSFT]",
                                "ready_closed"
                            ],
        "expectedGroupings":  [
                                  "explicit predicate subset"
                              ],
        "expectedOperators":  [
                                  "compare exact typed membership subsets"
                              ],
        "expectedComparison":  {
                                   "left":  "exact ticker set [AAPL,NVDA]",
                                   "right":  "exact ticker set [MSFT]",
                                   "basis":  "ready_closed trade count"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "known covered comparable ticker",
                                            "field-owned case rule",
                                            "ready_closed trade count",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-13",
        "caseType":  "ranking",
        "input":  "Rank top 10 known covered ticker-set members [AAPL,NVDA,MSFT] by accepted execution share quantity, largest-first, retaining boundary ties.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "top 10"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership",
                                  "rank by execution share quantity",
                                  "largest-first",
                                  "retain ties at boundary"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage",
                                            "ranking metric",
                                            "direction",
                                            "tie policy",
                                            "limit"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-14",
        "caseType":  "negation",
        "input":  "Show known covered tickers not in the explicit deduplicated [AAPL,NVDA,MSFT] set.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "grouped negation; unknown never becomes a nonmember/nonmatch"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-15",
        "caseType":  "exclusion",
        "input":  "Exclude known covered records whose ticker is a member of explicit set [AAPL,NVDA,MSFT].",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit exclusion of known covered subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-16",
        "caseType":  "multi_filter",
        "input":  "Show ready-closed NVDA records AND ticker membership in explicit set [AAPL,NVDA,MSFT].",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule",
                                "ready_closed",
                                "ticker exactly NVDA"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership",
                                  "AND clear scope"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-17",
        "caseType":  "multi_part",
        "input":  "Show exact ticker members [AAPL,NVDA] AND accepted Stock execution share quantity above 100, multiplier 1/unit shares; report both coverage.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "exact finite deduplicated set [AAPL,NVDA]",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003e100"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership",
                                  "strict quantity predicate",
                                  "AND clear scope",
                                  "report both coverage"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-18",
        "caseType":  "ambiguous",
        "input":  "Show trades in my set.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which known covered field and finite explicit typed set should I use?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-19",
        "caseType":  "negative_example",
        "input":  "Treat an unknown ticker as not in the set.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "unknown or missing evidence"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject unknown inference"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Unknown or missing evidence cannot satisfy membership, non-membership, or text-match negation.",
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-20",
        "caseType":  "unsupported_data",
        "input":  "Use mixed USD and CAD money values as one membership set without a currency rule.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "incompatible or unauthorized request"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject unsafe fallback"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Membership requires one compatible typed field with field-owned unit/currency rules.",
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected authorized ticker set, show known covered members only.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "finite explicit deduplicated ticker set [AAPL,NVDA,MSFT]",
                                "field-owned case rule"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized predicate context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E10-22",
        "caseType":  "cross_category",
        "input":  "Explain gross P/L for ready-closed exact ticker-set members [AAPL,NVDA].",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "membership",
                                          "ticker",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "known covered ticker",
                                "exact finite deduplicated set [AAPL,NVDA]",
                                "ready_closed",
                                "gross P/L eligibility"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "exact typed membership filters metric population"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "Category 2 gross P/L contract",
                                            "known covered comparable ticker",
                                            "field-owned case rule",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    }
]
```

## Evaluation Array `C12-E11` -- `text_search`
```json
[
    {
        "caseId":  "C12-E11-01",
        "caseType":  "canonical",
        "input":  "Search the separately authorized covered notes field using accepted matcher v1 with explicit case and token rules for the exact term risk. For the canonical request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-02",
        "caseType":  "formal_paraphrase",
        "input":  "Retrieve privacy-safe match coverage from the separately authorized covered notes field using accepted matcher v1 and its documented exact case/token rules for risk.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-03",
        "caseType":  "conversational_paraphrase",
        "input":  "Which of my covered notes match exact risk under the authorized matcher v1 with its documented case/token rules?",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-04",
        "caseType":  "trader_slang",
        "input":  "Pull privacy-safe covered note hits for exact risk under matcher v1 only.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-05",
        "caseType":  "abbreviation",
        "input":  "Search authorized notes m1 exact-risk using documented case/token rules.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-06",
        "caseType":  "misspelling",
        "input":  "Serch authorized covered notes using matcher v1 exact term risk.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-07",
        "caseType":  "noisy_input",
        "input":  "auth covered notes matcher v1 exact risk pls",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-08",
        "caseType":  "command",
        "input":  "Search the separately authorized covered notes field using accepted matcher v1 with explicit case and token rules for the exact term risk. For the command request.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-09",
        "caseType":  "fragment",
        "input":  "Authorized notes matcher v1: exact risk.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-10",
        "caseType":  "follow_up",
        "input":  "Keep the trusted prior authorized notes field, matcher v1, case/token rules, and exact risk query.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior authorized predicate context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-11",
        "caseType":  "correction",
        "input":  "I meant matcher v2, but its authorized contract is not supplied.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "requested matcher v2 contract not supplied"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "do not infer matcher v2 semantics",
                                  "stage clarification before matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted prior authorized text-search context",
        "expectedContextRequirements":  [
                                            "separately authorized covered text field",
                                            "accepted matcher v2/version contract",
                                            "documented exact v2 case/token rules",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "What is the accepted matcher v2 contract, including its exact case and token rules?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "Fail closed: matcher v2 semantics are not inferred from matcher v1."
    },
    {
        "caseId":  "C12-E11-12",
        "caseType":  "comparison",
        "input":  "Compare ready_closed trade count for exact authorized matcher-v1 term risk versus exact authorized matcher-v1 term stop.",
        "expectedPrimaryIntent":  "compare_groups",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "documented exact v1 case/token rules",
                                "exact authorized term risk",
                                "exact authorized term stop",
                                "ready_closed"
                            ],
        "expectedGroupings":  [
                                  "explicit predicate subset"
                              ],
        "expectedOperators":  [
                                  "compare exact authorized text-match subsets"
                              ],
        "expectedComparison":  {
                                   "left":  "exact authorized matcher-v1 term risk",
                                   "right":  "exact authorized matcher-v1 term stop",
                                   "basis":  "ready_closed trade count"
                               },
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "authorized covered text field",
                                            "accepted matcher v1",
                                            "documented exact case/token rules",
                                            "ready_closed trade count",
                                            "privacy-safe coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-13",
        "caseType":  "ranking",
        "input":  "Rank top 10 exact matcher-v1 risk-note matches by accepted execution share quantity, largest-first, retaining boundary ties.",
        "expectedPrimaryIntent":  "rank_results",
        "expectedSecondaryIntents":  [
                                         "retrieve_records"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "top 10"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching",
                                  "rank by execution share quantity",
                                  "largest-first",
                                  "retain ties at boundary"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage",
                                            "ranking metric",
                                            "direction",
                                            "tie policy",
                                            "limit"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-14",
        "caseType":  "negation",
        "input":  "Show covered authorized notes that do not match exact risk under matcher v1 with complete coverage.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "grouped negation; unknown never becomes a nonmember/nonmatch"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-15",
        "caseType":  "exclusion",
        "input":  "Exclude known covered records with exact matcher-v1 risk match; do not expose text.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "explicit exclusion of known covered subset"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-16",
        "caseType":  "multi_filter",
        "input":  "Show ready-closed records with authorized matcher-v1 exact risk match AND ticker NVDA.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk",
                                "ready_closed",
                                "ticker exactly NVDA"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching",
                                  "AND clear scope"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-17",
        "caseType":  "multi_part",
        "input":  "Show authorized exact matcher-v1 risk matches AND accepted Stock share quantity above 100, multiplier 1/unit shares; report both coverage.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [
                                         "inspect_data_quality"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes",
                                          "size"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk",
                                "accepted Stock execution share quantity",
                                "multiplier 1",
                                "unit shares",
                                "quantity \u003e100"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching",
                                  "two compatible predicates",
                                  "AND clear scope",
                                  "report both coverage"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-18",
        "caseType":  "ambiguous",
        "input":  "Search my notes.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [

                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [

                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  true,
        "expectedClarificationQuestion":  "Which separately authorized covered text field and accepted matcher/version should I use?",
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-19",
        "caseType":  "negative_example",
        "input":  "Treat missing notes coverage as a nonmatch.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "unknown or missing evidence"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject unknown inference"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Unknown or missing evidence cannot satisfy membership, non-membership, or text-match negation.",
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-20",
        "caseType":  "unsupported_data",
        "input":  "Search raw private source files with fuzzy semantic regex matching.",
        "expectedPrimaryIntent":  "unsupported_request",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "incompatible or unauthorized request"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "reject unsafe fallback"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  true,
        "expectedUnsupportedReason":  "Raw/private search and fuzzy, semantic, or regex defaults are not authorized.",
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-21",
        "caseType":  "selected_entity_context",
        "input":  "For the trusted selected authorized notes-search context, show privacy-safe match coverage only.",
        "expectedPrimaryIntent":  "retrieve_records",
        "expectedSecondaryIntents":  [

                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  "trusted selected authorized predicate context",
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    },
    {
        "caseId":  "C12-E11-22",
        "caseType":  "cross_category",
        "input":  "Explain gross P/L for ready-closed records with authorized exact matcher-v1 risk match without quoting text.",
        "expectedPrimaryIntent":  "explain_result",
        "expectedSecondaryIntents":  [
                                         "calculate_metric"
                                     ],
        "expectedCanonicalConcepts":  [
                                          "text_search",
                                          "notes",
                                          "gross_pnl"
                                      ],
        "expectedFilters":  [
                                "separately authorized covered notes field",
                                "accepted matcher v1",
                                "explicit case/token rules",
                                "exact query risk",
                                "ready_closed"
                            ],
        "expectedGroupings":  [

                              ],
        "expectedOperators":  [
                                  "authorized exact text matching",
                                  "filters metric population"
                              ],
        "expectedComparison":  null,
        "expectedTimeRange":  null,
        "expectedSelectedEntity":  null,
        "expectedContextRequirements":  [
                                            "server-authorized scope",
                                            "known covered accepted facts",
                                            "coverage",
                                            "Category 2 gross P/L contract",
                                            "no motive, causation, or advice inference"
                                        ],
        "expectedCapabilityStatus":  "Planned",
        "expectedProtectedAction":  null,
        "confirmationExpected":  false,
        "clarificationExpected":  false,
        "expectedClarificationQuestion":  null,
        "unsupportedExpected":  false,
        "expectedUnsupportedReason":  null,
        "notes":  "No default field, set, matcher, raw text disclosure, inference, causation, or advice."
    }
]
```
---

# 8. Coverage Report Deliverable

All 11 canonical records, 11 registries, and 242 evaluation cases passed
independent review. Evaluation aggregates are 15 clarification, 22 unsupported,
11 cross-category, 44 nonempty-secondary, 0 confirmation, and 0 protected
cases. Coverage review is accepted; controller approval, locks, Version 1,
master synchronization, completion, and runtime support remain out of scope.

**Interim canonical coverage:** 11 of 11 controlling items have a Version 0
draft canonical record; 11 of 11 language registries and 242 evaluation cases
exist.

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
- [x] Duplicate/overlap boundaries are documented and accepted.

## Canonical Inventory

- [x] Every item has a completed Version 0 draft canonical record.
- [x] Every item has a stable inventory ID.
- [x] Every item has a draft canonical name.
- [x] Every item has an exact draft definition.
- [x] Related concepts are documented.
- [x] Classification, status, and version are complete for canonical records.
- [x] Independent canonical-record review is complete and accepted.

## Language Registry

- [x] Registry Batches 1-2b are drafted: 11 of 11 records; independent review passed and controller acceptance is recorded.
- [x] Formal wording is complete and accepted.
- [x] Conversational wording is complete and accepted.
- [x] Trader slang is complete and accepted.
- [x] Abbreviations and misspellings are complete and accepted.
- [x] Questions, commands, fragments, follow-ups, and corrections are complete and accepted.
- [x] Comparison, ranking, negation, exclusion, multi-filter, and ambiguity coverage is complete and accepted.

## Execution Requirements

- [x] Required data and typed operand boundaries are documented.
- [x] Valid/invalid predicate compatibility is documented.
- [x] Defaults and clarification conditions are documented.
- [x] Unsupported and privacy conditions are documented.
- [x] Tool targets, per-record units, fee/open-trade rules, and registry-level combinations are complete and accepted.
- [x] Registry-level execution requirements are drafted for all 11 records.

## Evaluation

- [x] Evaluation cases exist for every important concept: 11 of 11 arrays and 242 of 242 cases passed.
- [x] Expected structured interpretations are present and accepted: 242 passed, 0 failed, 0 unreviewed.
- [x] Negative, ambiguous, unsupported, and cross-category cases are tested and accepted across the full suite.

## Coverage Report

- [x] Canonical count is complete and approved: 11 of 11.
- [x] Gaps are fully resolved for Version 0 review.
- [x] Final overlaps are reviewed and accepted for Version 0 review.
- [x] Unsupported capabilities are final for Version 0 review.

## Approval

- [x] Pre-completion review gate was reached.
- [x] Review changes are completed.
- [x] Canonical names are approved and locked.
- [x] Registry deliverables are approved and locked.
- [x] Version is updated to 1.
- [x] Master tracker is synchronized by the controller.
- [x] Change log records final acceptance.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- Independent Terra planning review passed; the controller accepted the exact
  11-item planning inventory for Version 0 canonical production.
- Independent Terra canonical-record review passed; the controller accepted all
  11 Section 5 records for registry production.
- Independent registry review passed for all 11 Section 6 registries; the
  controller accepted them for evaluation production.
- All E1 through E11 evaluation arrays passed independent review after the
  recorded remediations: 242 reviewed, 242 passed, 0 failed, and 0 unreviewed.

## Required Changes

- None. Comprehensive independent review passed and controller approval is
  recorded below.

## Completed Changes

- Created the planning-only Version 0 source-order inventory and cross-category
  boundaries. This is not an approval decision.
- Restored the template planning-subsection order: dependencies, risks, then
  typed operator/composition decisions. The inventory and statuses remained
  unchanged until their later review gates.
- Advanced the accepted plan to 11 complete draft canonical records while
  preserving the source order, `Planned` statuses, and no-runtime boundary.
- Added Registry Batch 1 for equality through strict less-than: five complete
  38-subsection drafts, all Version 0/unapproved/unlocked.
- Added Registry Batch 2a for inclusive less-than, range, and inclusion: three
  complete 38-subsection drafts, all Version 0/unapproved/unlocked.
- Added Registry Batch 2b for exclusion, membership, and text search: three
  complete 38-subsection drafts, all Version 0/unapproved/unlocked.
- Recorded controller acceptance after independent PASS of all 11 registries.
- Added the initial C12-E1 equality through C12-E6 less-than-or-equal
  evaluation production batch: 132 of 242 cases at that checkpoint.
- Applied Batch 1 review fixes: accepted first-opening allocation price in USD;
  accepted Stock execution share quantity with multiplier 1 and unit shares;
  ambiguous `EQ`/`NEQ`; explicit comparison bases; and explicit trusted
  temporal cutoff semantics.
- Remediated the cited Batch 1 cases with concrete bases: accepted
  first-opening allocation price in USD; accepted Stock execution share
  quantity with multiplier 1 and unit shares; explicit ready_closed trade
  counts for E1/E2 comparisons; accepted Stock execution counts for E3; and
  largest-first execution-share-quantity ranking with retained ties.
- Remediated E4-E6 evaluation case-type alignment: concrete first-opening USD
  price operands; genuine misspellings, fragments, trusted follow-ups, and
  corrections; exclusion as removal of a typed predicate complement; complete
  top-10 rankings with boundary ties; and two explicit compatible predicates
  in each multi-part case.
- Added E7 range, E8 inclusion, and E9 exclusion arrays: 198 of 242 cases at
  that checkpoint. Range cases declare typed endpoint order and inclusivity; set
  cases require known covered explicit compatible subsets and never infer a
  missing or private value.
- Remediated five E7-E9 expected-interpretation alignments: the range
  exclusion case now stages field selection before any endpoint/basis choice;
  Stock-quantity range concepts include `size`; and NVDA set cases correctly
  bind to `ticker` rather than instrument type.
- Rechecked the same E7-E9 boundary: E7-15 now carries only its Stock
  execution-share range filters, E7-17 explicitly includes currency for its
  USD predicate, and E8/E9-15 use the known-covered NVDA ticker subset rather
  than a copied Stock instrument-type subset.
- Recorded controller acceptance of independently passed E1-E9 and added E10
  membership and E11 text-search arrays, completing 242 saved cases without
  approving, locking, or completing Version 0.
- Remediated the E10-E11 independent-review alignment: corrected membership
  sets are explicit and finite, comparison labels name their exact subsets,
  safe language variants retain their typed prerequisites, and the unprovided
  matcher-v2 correction now asks for its authorized contract instead of
  inferring matcher semantics.

## Approval Decision

- Status: Complete; canonical, registry, evaluation, and coverage gates passed.
- Approved by: Lead controller.
- Approval date: 2026-08-11.
- Version: 1.
- Canonical names locked: Yes; all 11 registries locked.
- Master tracker synchronization: Yes.

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-11 | Completed Category 12 Version 1 after controller approval | Lock all 11 canonical names and registries after 242 reviewed and passed evaluation cases; preserve Planned capability statuses and no-runtime boundary | 1 |
| 2026-08-11 | Advanced Category 12 to pre-lock Ready for Review after comprehensive independent PASS | Record 242 reviewed and passed cases with accepted canonical, registry, evaluation, and coverage gates while preserving unapproved and unlocked Version 0 boundaries | 0 |
| 2026-08-11 | Repaired recursive mojibake in 15 diagnosed lines and restored 11 registry headings | Normalize UTF-8 document integrity while preserving all Category 12 records, registries, evaluations, and Version 0 gates | 0 |
| 2026-08-11 | Added unreviewed C12-E7 range, C12-E8 inclusion, and C12-E9 exclusion arrays | Advance evaluation production to 198 of 242 saved cases; E1-E6 passed independent review, E7-E9 await review, and E10-E11 remain pending | 0 |
| 2026-08-11 | Controller accepted independently passed E1-E9 and added unreviewed C12-E10 membership and C12-E11 text-search arrays | Complete the 242-case Version 0 suite while retaining E10-E11 review, overall approval, lock, and completion gates | 0 |
| 2026-08-11 | Recorded controller registry acceptance and added unreviewed C12-E1 through C12-E6 evaluation arrays | Advance evaluation production to 132 of 242 saved cases after independent registry PASS; retain remaining arrays, review, approval, and lock gates | 0 |
| 2026-08-11 | Added Registry Batch 2b drafts for exclusion, membership, and text search | Complete all 11 draft registries while retaining independent-review and evaluation gates | 0 |
| 2026-08-11 | Added Registry Batch 2a drafts for inclusive less-than, range, and inclusion | Advance only three more exact operator records; retain 8-of-11 progress and defer evaluation | 0 |
| 2026-08-11 | Controller accepted all 11 canonical records and added 5 Registry Batch 1 drafts | Begin language-registry production only for equality through strict less-than; preserve unapproved/unlocked Version 0 state | 0 |
| 2026-08-11 | Controller accepted planning and added all 11 Version 0 draft canonical records | Advance only the accepted planning inventory into canonical production; defer registries and evaluations | 0 |
| 2026-08-11 | Restored template order for planning subsections 3.2-3.4 without changing inventory or capability status | Keep the draft reviewable against the shared completion template | 0 |
| 2026-08-11 | Created Version 0 planning inventory with all eleven source-order operator groups and deferred Sections 5-8 | Establish typed operand, comparison/range/set/text, coverage, precedence, authorization, privacy, and no-invention boundaries before production | 0 |
