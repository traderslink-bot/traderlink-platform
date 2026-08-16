# Category 15: Context and Conversation Language

# Category Metadata

| Field | Value |
|---|---|
| Category name | Context and Conversation Language |
| Category number | 15 |
| Category slug | context-conversation-language |
| File name | 15-context-conversation-language.md |
| Category type | Structured conversation state, reference resolution, and follow-up modification vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-11 |
| Last updated | 2026-08-11 |
| Dependencies | Locked Categories 1, 11, 13, 14, and 18; accepted structured-query, Journal authorization, selected-entity, factual-snapshot, coverage, and privacy contracts |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** Mapped context remains subject to
> fresh server-side revalidation; it grants no raw IDs, cross-account scope, or mutation.

**Production and approval state:** Historical Version 0 production began when
the lead controller accepted the exact source-backed 18-item planning inventory
and authorized bounded canonical production on 2026-08-11. Canonical Batch 1 produced complete Version 0
records for `C15-CTX-001` through `C15-CTX-006` and independently PASSed before
controller acceptance. Canonical Batch 2 produced complete Version 0
records for `C15-CTX-007` through `C15-CTX-012` and independently PASSed before
controller acceptance. Canonical Batch 3 produced complete Version 0
records for `C15-CTX-013` through `C15-CTX-018` and independently PASSed before
controller acceptance, bringing Section 5 to 18/18 reviewed/PASS canonical
drafts. Registry Batch 1 produced complete Version 0 registries for
`C15-CTX-001` through `C15-CTX-006` and independently PASSed before controller
acceptance. Registry Batch 2 produced complete Version 0 registries for
`C15-CTX-007` through `C15-CTX-012` and independently PASSed before controller
acceptance. Registry Batch 3 produced complete Version 0 registries for
`C15-CTX-013` through `C15-CTX-018` and independently PASSed before controller
acceptance, bringing Section 6 to 18/18 reviewed/PASS registry drafts.
Evaluation Batch 1 (`C15-E1` through `C15-E3`) independently PASSed and was
controller-accepted on 2026-08-11: 66 reviewed Version 0 `Planned` cases.
Evaluation Batch 2 (`C15-E4` through `C15-E6`) independently PASSed after
its two exact gross-expectancy findings were remediated and was controller-
accepted on 2026-08-11, bringing `C15-E1` through `C15-E6` to 132
reviewed/PASS Version 0 `Planned` cases. Evaluation Batch 3 (`C15-E7` through
`C15-E9`) independently PASSed after its scoped temporal-comparison remediation
and was controller-accepted on 2026-08-11, bringing `C15-E1` through `C15-E9`
to 198 reviewed/PASS Version 0 `Planned` cases. Evaluation Batch 4 (`C15-E10`
through `C15-E12`) independently PASSed and was controller-accepted on
2026-08-11, bringing `C15-E1` through `C15-E12` to 264 reviewed/PASS Version 0
`Planned` cases. Evaluation Batch 5 (`C15-E13` through `C15-E15`)
independently PASSed after its five scoped residuals were remediated, bringing
`C15-E1` through `C15-E15` to 330 reviewed/PASS Version 0 `Planned` cases.
Evaluation Batch 6 (`C15-E16` through `C15-E18`) independently PASSed after its
three scoped new-question clarification residuals were remediated. All six
evaluation batches, all 18 arrays, and all 396 Version 0 `Planned` cases had
independently PASSed with 0 failed, unreviewed, undrafted, or pending cases
before the approval transition.
The lead controller approved and locked all 18 exact canonical names and all 18
registries at Version 1 on 2026-08-11. The master tracker now records Category
15 as Complete Version 1 and locked. All 18 capabilities remain `Planned`. No parser, query,
Chat route, provider call, database change, or runtime capability is claimed or
authorized.

**Controlling-source count resolution:** Stage 2 of the complete language plan
declares twelve ordered fields in the structured conversation state. Section 12
then declares six ordered follow-up modification/continuation families. The
exact proposed controlling inventory is therefore 18 records, in that source
order: `C15-CTX-001` through `C15-CTX-018`. The Stage 2 heading, its example
phrases, Section 31 selected-object examples, Section 41 correction workflow,
pronouns, and individual correction targets are required shared semantics or
later language material; they do not silently create extra canonical records.
The lead controller accepted this exact count, source order, and planning
boundary on 2026-08-11 without approving or locking canonical names.

**Controlling inventory status:** 18 `Planned`, 0 `Supported`, 0
`Unavailable`, 0 `Unsupported`, and 0 `Deprecated`. `Planned` identifies a
future language/query target only. Existing Journal facts, selected-page data,
and structured-query primitives do not make AI Chat context resolution
executable.

---

# 1. Category Purpose

Category 15 gives the future AI Companion a bounded way to understand a message
that depends on an already accepted query, answer, selection, or ambiguity. It
defines the structured state slots that can be carried between turns and the
six source-declared ways a later message can modify or continue an accepted
request. Its purpose is to make wording such as `What about June?`, `Only under
$5`, `Break that down by weekday`, `Explain how you calculated it`, `this`,
`that`, `it`, `those`, `the same filters`, and a user's explicit correction
resolve to typed changes instead of a prose guess.

Structured state is authoritative over prose reconstruction whenever it is
available. A follow-up begins from the last accepted interpretation, applies
only explicit compatible changes, validates the resulting complete request,
and replaces accepted query state only after that new interpretation is
accepted. A separate typed, privacy-safe pending-ambiguity record may be written
only when the validator accepts a `clarification_needed` outcome; that record is
tied to the unchanged accepted-state revision and cannot replace or partially
mutate any accepted query field. Rejected, unsupported, unsafe, or unvalidated
attempts update neither track. When the clarification is accepted, one atomic
transition applies one of two outcomes: a validator-accepted complete
clarification clears the pending marker and creates the next complete accepted
query revision, while a validator-accepted still-ambiguous
`clarification_needed` outcome replaces only the pending marker and leaves the
accepted query revision unchanged. A message that does not validly modify or
continue prior state is a new question and must be interpreted from its own
explicit inputs and any separately trusted UI context.

This category owns conversation-state and follow-up language contracts only.
It does not define intents, metrics, dimensions, operators, dates, comparisons,
response modes, ambiguity policy, privacy policy, analytics formulas, factual
selected entities, account authorization, or any write. It may reference those
locked owners but cannot change their meaning.

---

# 2. Category Boundaries

## Included

The exact controlling source vocabulary covers, in source order:

- twelve structured conversation-state fields: last intent; last metric or
  metric set; active date range; active filters; active comparison; active
  grouping; selected trade; selected ticker; selected journal entry; current
  account; response detail level; and unresolved ambiguity; and
- six follow-up families: filter modification; time modification; metric
  modification; grouping modification; detail modification; and comparison
  continuation.

Shared planning semantics also cover:

- resolving references and pronouns such as `this`, `that`, `it`, `one`,
  `those`, and `same` only to a unique compatible typed candidate in accepted
  conversation state or trusted UI context;
- retaining unchanged accepted fields while applying explicit filter, time,
  metric, grouping, comparison, response-detail, sort, limit, or basis changes;
- distinguishing a valid modification/continuation from a new question;
- explanation follow-ups that reuse the exact accepted result contract without
  changing its metric, population, facts, or mathematical value;
- applying explicit corrections to the current query without changing global
  definitions from one message; and
- asking one focused clarification question when the highest-impact reference
  or change remains unresolved.

## Excluded

- Primary and secondary intent meaning, protected-action handling, and
  confirmation: Category 1.
- Metric definitions, formulas, units, gross/net and fee basis, denominators,
  eligibility, and availability: Categories 2-10.
- Account, ticker, trade, journal-entry, tag, rule, and other factual
  dimensions or selected-entity existence: Category 11.
- Predicate/operator meaning and boolean composition: Category 12.
- Date, time, session, timezone, event-basis, and range resolution: Category
  13.
- Comparison sides, rank direction, sort semantics, ties, baselines, and
  limits: Category 14.
- Trader terminology, slang, user aliases, and terminology learning: Category
  16.
- Global ambiguity levels, safe defaults, confidence policy, and clarification
  policy: Category 17.
- Response-mode definitions and presentation formatting: Category 18.
- Authorization, privacy, security, evidence, causation, advice, prediction,
  provider, logging, and retention policy: Category 19.
- Cross-category acceptance proof: Category 20.
- Runtime implementation, model prompts, provider calls, unrestricted history,
  browser inference, database access, writes, drafts, confirmations, mutations,
  or production activation.

## Cross-Category References

- Category 1 supplies the accepted intent that may be retained or explicitly
  replaced. A context reference cannot invent an intent or authorize a
  protected action.
- Categories 2-10 supply metric contracts. `Use net profit instead`, `show
  percentages`, and basis corrections can select only a locked compatible
  concept; they cannot rewrite a formula, fee rule, unit, or eligible
  population.
- Category 11 supplies server-authorized factual entities and account scope.
  Selected-trade, selected-ticker, selected-journal-entry, and current-account
  state slots contain only typed references whose existence and access are
  revalidated server-side.
- Category 12 owns add/remove/replace filter operations and conflict detection.
  This category carries an accepted filter set and recognizes modification
  language; it does not define predicate truth.
- Category 13 resolves a new time phrase before it replaces the active date
  range. No prior date, browser clock, device time, or server-local wall time is
  guessed.
- Category 14 owns comparison, grouping-dependent ordering, sort direction,
  baseline, and finite-limit contracts. This category may retain or explicitly
  modify those accepted fields only after validation.
- Category 17 later decides whether missing or conflicting context may use a
  safe default or requires focused clarification. Category 15 records the
  unresolved ambiguity without choosing a meaning.
- Category 18 owns the six response modes. Category 15 carries an accepted
  response-detail level and recognizes detail modifications without changing
  analytical truth.
- Category 19 must enforce account isolation, minimum context, privacy-safe
  references, prompt-injection resistance, and evidence boundaries at every
  turn. Context never broadens authorization.

---

# 3. Planning Analysis

Planning must be completed before canonical records or language coverage begin.

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?** It maps the twelve
   source-declared state fields and six source-declared follow-up families to a
   structured, accepted-state delta without reconstructing state from prose,
   inventing a referent, or silently broadening account/data scope.
2. **What canonical concepts belong here?** Only the eighteen source-order
   records in Section 4. Pronouns, individual example phrases, correction field
   names, selected-page examples, and the general context-resolution heading
   are shared language/behavior for those records, not extra proposed records.
3. **What related concepts belong elsewhere?** Intent, metrics, dimensions,
   operators, temporal meaning, comparisons/rankings, slang, ambiguity policy,
   response modes, policy, and final proof remain with Categories 1-14 and
   16-20 as listed in Section 2.
4. **What data is required?** The current server-authorized user/workspace/
   Journal-account scope; conversation identity; last accepted structured query
   and response contract; accepted state revision; permitted recent context and
   server-built older-context summary; trusted typed UI/page selection; selected
   entity type and opaque reference; factual snapshot/digest and coverage; data-
   availability summary; and the new original message plus normalized form.
5. **Which deterministic tools will answer these requests?** A future bounded
   context resolver may produce an explicit state delta; the existing/future
   structured-query validator must validate the complete result; the owning
   deterministic analytics tool may then execute it. This plan authorizes no
   resolver, parser, validator change, tool invocation, or runtime.
6. **Which concepts are directly observed?** The server may observe the saved
   accepted state revision, accepted structured query, authorized account
   scope, typed UI/page context, saved selected-entity references, response
   mode, and unresolved-ambiguity marker. Prose does not turn an entity or
   account into an observed fact.
7. **Which concepts are deterministically derived?** Reference resolution and
   an add/remove/replace/retain/reset state delta are derived only from the new
   message, a unique compatible typed candidate, the accepted prior state, and
   the owning validators. A validated complete interpretation may derive the
   next accepted query revision. A validator-accepted `clarification_needed`
   outcome may instead derive only a typed privacy-safe pending-ambiguity record
   tied to the unchanged accepted revision; it derives no accepted-field delta.
8. **Which concepts are proxy indicators?** Recency, proximity in prose, the
   visible page, repeated wording, `same`, `this`, `that`, or `it` may rank
   possible referents but never proves identity, authorization, factual
   continuity, or user intent. A non-unique material choice requires
   clarification.
9. **Which concepts are user-labelled?** Explicit user corrections, named
   saved tags/rules/setups, user-specific aliases, and response preferences can
   be inputs only under their owning typed, authorized, versioned contracts. A
   single correction updates the current query; it does not rewrite a global
   definition.
10. **Which concepts are not measurable?** A missing prior state, unknown or
    unauthorized selected entity, invalidated factual digest, incompatible
    retained field, ambiguous pronoun, unaccepted earlier interpretation, or
    unavailable older context cannot be resolved as an accepted query. A
    validator-accepted `clarification_needed` result may preserve only its typed
    privacy-safe unresolved field/candidates in the pending track while leaving
    the accepted revision unchanged. Otherwise return truthful unsupported/
    unavailable state, never a fabricated referent, empty result, zero, stale
    assumption, or unvalidated ambiguity marker.
11. **Which terms are ambiguous?** `this`, `that`, `it`, `one`, `ones`, `those`,
    `them`, `same`, `again`, `there`, `here`, `before`, `after`, `previous`,
    `current`, `only`, `just`, `instead`, `more`, `less`, `better`, `difference`,
    `the trades`, `the answer`, `show me`, and any omitted account, entity,
    metric, filter field, time range, group, comparison side, sort, limit, basis,
    or response-detail target.
12. **What defaults are safe?** Retain an unchanged field only from the latest
    accepted compatible structured state. An explicit modification changes only
    its validated target and preserves other compatible accepted fields. A
    pending ambiguity has no default meaning and supplies no query value; it is
    only a typed privacy-safe question state tied to the unchanged accepted
    revision. No default exists for an unresolved referent, account, selected
    entity, comparison target, correction scope, sort, limit, basis, or
    ambiguous replacement. Structured state outranks prose reconstruction.
13. **What conditions require clarification?** Ask one focused question when a
    reference has multiple compatible candidates or none; the prior accepted
    query is missing; a requested modification does not identify its target;
    retained fields become incompatible; a selected entity is absent,
    unauthorized, wrong-typed, or no longer valid; the message could materially
    be either a new question or a modification; or an unresolved ambiguity
    blocks validation. Ask the highest-impact field first and stage later
    questions.
14. **What combinations are invalid?** Updating from a rejected/unaccepted
    interpretation; merging state across conversations or accounts; treating a
    raw/opaque ID as authorization; accepting client-selected scope without
    server verification; reconstructing state from prose when structured state
    exists; retaining an incompatible filter/group/metric/time/basis; applying
    a correction globally; using stale or mismatched factual context; inventing
    browser/device/user facts; changing analysis during a detail/explanation
    follow-up; writing a pending marker without a validator-accepted
    `clarification_needed` outcome; applying a pending ambiguity as an accepted
    query field; partially mutating accepted state while asking clarification;
    retaining the old pending marker after a complete clarification is accepted;
    treating a still-ambiguous `clarification_needed` answer as an accepted
    query update; bypassing a clarification, capability, confirmation, privacy,
    or protected-action gate; and writing or mutating Journal facts.
15. **What evaluation coverage proves completion?** Later Sections 5-8 must
    cover all eighteen records; multi-turn retain/add/remove/replace/reset
    behavior; `this`/`that`/`it`/`same` references; trusted selected trade,
    ticker, journal entry, account, and page context; new-question versus
    modification classification; filter/time/metric/grouping/detail/comparison
    continuation; sort/limit/basis corrections; explanation follow-ups;
    two-track atomic accepted-query/pending-ambiguity updates; missing, stale,
    ambiguous, unauthorized, and
    incompatible state; account isolation/privacy; unsupported capabilities;
    and cross-category query assertions.

## 3.2 Dependencies

- **Locked language dependencies:** Category 1 for accepted intent and
  protected-action boundaries; Categories 2-10 for metrics; Category 11 for
  dimensions, selected entities, factual scope, and coverage; Category 12 for
  predicate operations; Category 13 for resolved time; Category 14 for
  comparison/ranking composition; and Category 18 for response modes.
- **Conversation contracts:** persisted original message, accepted structured
  query and response contract, monotonic accepted-state revision, explicit
  conversation identity, permitted recent context, bounded server summary of
  older context, and a distinction between accepted, rejected, pending,
  clarified, failed, and unsupported interpretations.
- **Authorization and privacy contracts:** one server-authorized Platform user,
  workspace, and selected Journal account; a conversation permanently scoped to
  that account; server-validated typed selected-entity handles; minimum factual
  snapshots; private account-scoped history; and privacy-safe operational
  metadata without private prompt, answer, note, trade, or raw-identity values.
- **Validation and data contracts:** current capability registry, current
  data-availability summary, factual snapshot/digest, schema-valid full query,
  conflict detection, coverage, and owning deterministic tool result contract.
- **Future dependencies:** Category 16 for trader terminology and user aliases;
  Category 17 for global ambiguity/confidence/clarification policy; Category 19
  for security, evidence, privacy, advice, causation, provider, logging, and
  retention policy; and Category 20 for cross-category proof.
- **Unsupported dependencies:** unlimited history; prose-only state recovery
  when structured state exists; arbitrary browser/application/database/network
  access; client-selected account authorization; raw account, broker, source,
  execution, trade, conversation, message, or request identifiers in model
  context or trader-visible output; user/device/browser clocks or inferred
  selections; unvalidated stale state; V3 fallback; unrestricted SQL; provider
  invention; and any AI-only write path.

## 3.3 Risks, Overlaps, and Decisions

| Area | Draft decision / risk control |
|---|---|
| Source preservation | Preserve exactly the twelve Stage 2 structured-state fields followed by the six Section 12 follow-up families. Section headings, examples, pronouns, selected-object examples, and the correction workflow are shared semantics/later language material, not extra records. |
| Structured-state authority | Load the latest accepted structured state before reference resolution. Do not reconstruct or overwrite it from transcript prose when the structured object is available. Preserve the original messages for audit without treating their prose as the authoritative current query. |
| Accepted query and pending ambiguity tracks | Produce a proposed typed delta and validate the full resulting query. A validator-accepted complete clarification atomically clears the pending marker and creates the next complete accepted query revision. A validator-accepted still-ambiguous `clarification_needed` outcome atomically replaces only the typed privacy-safe pending marker tied to the unchanged accepted revision; it cannot replace or partially mutate accepted query fields. Rejected, unsupported, unsafe, or unvalidated answers update neither track. |
| Reference and pronoun resolution | `this`, `that`, `it`, `one`, `those`, `them`, and `same` resolve only to a unique compatible typed candidate in permitted accepted state or trusted UI context. Prose proximity, recency, or visibility alone cannot establish identity. |
| New question versus modification | Treat a message as a modification/continuation only when it targets an accepted prior query/result and yields a compatible validated state. Otherwise interpret it as a new question; do not silently carry filters, dates, entities, metrics, groups, comparisons, sorts, limits, or basis into an unrelated request. |
| Field corrections | An explicit correction may add, remove, replace, retain, or reset time, filter, metric, grouping, comparison, sort, limit, or basis fields. It applies to the current query only, invalidates dependent incompatible fields, and never changes a locked canonical/global definition from one message. |
| Filter modification | `only`, `just`, `remove`, and `exclude` map to explicit typed filter delta operations under Category 12. Removing one filter preserves other compatible accepted filters; a conflict or unknown target requires clarification instead of silent precedence. |
| Time modification | A new time phrase is resolved by Category 13 before replacing the active date range. It does not inherit a browser/device/server-local clock, guessed event basis, or stale `as_of`. |
| Metric, grouping, comparison, sort, limit, and basis | Each explicit change retains only compatible fields and follows the owning locked contract. A change that invalidates another field must reset it visibly or request clarification; it cannot silently reinterpret the old result. |
| Detail and explanation follow-ups | `Show me the trades`, `more detail`, `just the answer`, and `explain how you calculated it` reuse the exact accepted result/snapshot and may change presentation or evidence depth only. They cannot recalculate with another metric/population, invent causes, or turn prior narrative into new proof. |
| Sample-size continuation | `Is the sample large enough?` and similar detail/comparison continuations retain and revalidate the exact accepted result's eligible population, sample counts, exclusions, and coverage. Thresholds and interpretation remain with the locked owning metric/policy contract; never infer adequacy from answer prose, a stale result, or the word `sample` in context. |
| Selected UI objects | Accept only typed page context sent through the approved frontend/server contract and revalidated for the current user/workspace/account. An opaque internal handle may locate the object server-side but is neither sufficient authorization nor trader-visible/raw model context. With no trusted selection, clarify. |
| Account isolation | The current-account state is server-owned. A conversation never moves between accounts, a user phrase cannot change authorization, and no reference may resolve to another user's/workspace's/account's state or facts. |
| Stale or invalid context | Revalidate scope, selected entity, capability, factual digest, and retained query fields at the new turn. If prior context no longer matches the authorized current contract, mark it unavailable or clarify; do not invent when it changed, why it changed, or what the user/browser/device selected. |
| Ambiguity | Record unresolved ambiguity only through the validator-accepted pending track and ask one focused highest-impact question. The marker is privacy-safe, tied to the unchanged accepted revision, and never acts as an accepted query value. UI/accepted state may resolve a question only when the context is trusted, typed, unique, authorized, and compatible. A validator-accepted complete clarification atomically clears the marker and creates the next complete accepted query revision; a validator-accepted still-ambiguous `clarification_needed` outcome atomically replaces only the pending marker while the accepted revision remains unchanged; rejected, unsafe, unsupported, or unvalidated answers update neither. No broad checklist or hidden assumption is allowed. |
| Privacy and logging | Private conversation content remains account-scoped and the model receives only the minimum permitted context. Operational logs use opaque/digested privacy-safe metadata without query values or raw private content. |
| Category ownership | Category 15 owns state slots and modification/continuation semantics only. It does not redefine the values carried in those slots, global ambiguity/default policy, response modes, authorization/policy, or final evaluation. |

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

The table preserves all twelve Stage 2 structured conversation-state fields and
all six Section 12 follow-up families in exact source order. The controller has
accepted the complete planning inventory and authorized canonical production;
the exact Version 1 names and registries are now lead-controller approved and
locked.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|
| 1 | C15-CTX-001 | last_intent | Last Intent | Structured conversation state | Planned | Retain only the latest accepted primary/secondary intent contract in this conversation and account; an unaccepted turn, prose inference, or protected action cannot replace it. |
| 2 | C15-CTX-002 | last_metric_or_metric_set | Last Metric or Metric Set | Structured conversation state | Planned | Retain only locked metric concepts from the latest accepted compatible query, including exact basis/units/fee/population contracts; never infer a metric from a prior answer's prose. |
| 3 | C15-CTX-003 | active_date_range | Active Date Range | Structured conversation state | Planned | Retain only a Category 13-resolved accepted range with event/timezone/as-of/endpoints; a new time phrase must be resolved and validated before replacement. |
| 4 | C15-CTX-004 | active_filters | Active Filters | Structured conversation state | Planned | Retain an ordered validated typed filter expression from the accepted query; additions, removals, exclusions, and conflicts remain owned by Category 12. |
| 5 | C15-CTX-005 | active_comparison | Active Comparison | Structured conversation state | Planned | Retain only the accepted typed comparison sides, baseline, metric/basis, populations, and coverage; no inferred side, denominator, or account. |
| 6 | C15-CTX-006 | active_grouping | Active Grouping | Structured conversation state | Planned | Retain only accepted authorized Category 11 grouping dimensions and grain; a new grouping must remain compatible with metric, filters, comparison, and scope. |
| 7 | C15-CTX-007 | selected_trade | Selected Trade | Structured conversation state | Planned | Store only a trusted typed opaque reference revalidated server-side in the conversation's account; raw IDs, visible prose, and recency alone are not identity or authorization. |
| 8 | C15-CTX-008 | selected_ticker | Selected Ticker | Structured conversation state | Planned | Store only an explicit or trusted typed ticker selection validated in authorized factual scope; do not infer from a nearby trade, visible browser content, or another account. |
| 9 | C15-CTX-009 | selected_journal_entry | Selected Journal Entry | Structured conversation state | Planned | Store only a trusted typed opaque reference to an authorized accepted Journal entry; do not expose raw/private content or infer a selection from prose. |
| 10 | C15-CTX-010 | current_account | Current Account | Structured conversation state | Planned | Server-owned user/workspace/Journal-account scope permanently bounds the conversation; a message, opaque object ID, selected entity, or prior transcript cannot move or broaden it. |
| 11 | C15-CTX-011 | response_detail_level | Response Detail Level | Structured conversation state | Planned | Retain only an accepted Category 18 response mode; it may change presentation/evidence depth but never query meaning, facts, calculations, coverage, or policy. |
| 12 | C15-CTX-012 | unresolved_ambiguity | Unresolved Ambiguity | Structured conversation state | Planned | After a validator-accepted `clarification_needed` outcome, retain only a typed privacy-safe pending record of the highest-impact unresolved field/candidates tied to the unchanged accepted-state revision. It supplies no accepted query value and cannot partially mutate accepted fields. A validator-accepted complete clarification atomically clears the marker and creates the next complete accepted query revision. A validator-accepted still-ambiguous `clarification_needed` outcome atomically replaces only the pending marker while the accepted query revision remains unchanged. Rejected, unsupported, unsafe, or unvalidated answers update neither track. |
| 13 | C15-CTX-013 | filter_modification | Filter Modification | Follow-up modification | Planned | Apply explicit typed add/remove/exclude/retain/reset operations to accepted active filters while preserving other compatible state; conflict or unknown target requires clarification. |
| 14 | C15-CTX-014 | time_modification | Time Modification | Follow-up modification | Planned | Resolve an explicit new time expression under Category 13 and replace or narrow the accepted active range only after full-query validation; no guessed clock, range, or event. |
| 15 | C15-CTX-015 | metric_modification | Metric Modification | Follow-up modification | Planned | Replace or extend the accepted metric/set only with locked compatible metrics and explicit basis/units/fee/population contracts; reset or clarify dependent incompatible fields. |
| 16 | C15-CTX-016 | grouping_modification | Grouping Modification | Follow-up modification | Planned | Replace, add, remove, or refine the accepted grouping only with authorized factual dimensions and compatible metric/filter/comparison grain. |
| 17 | C15-CTX-017 | detail_modification | Detail Modification | Follow-up modification | Planned | Change response detail or request bounded evidence/explanation from the exact accepted result contract; never change calculation, factual snapshot, population, cause, or proof. |
| 18 | C15-CTX-018 | comparison_continuation | Comparison Continuation | Follow-up continuation | Planned | Continue an accepted comparison with an explicit compatible question about its results, consistency, difference, cause boundary, sample, or coverage; missing referent/metric/baseline requires clarification and no causal invention. |

## Proposed Inventory Additions

None at this planning checkpoint. `conversation_reference_resolution`,
pronouns, `same`-field retention, new-question detection, selected UI/page
context, explicit correction processing, accepted-only updates, add/remove/
replace/reset deltas, sort/limit/basis corrections, stale-context handling, and
explanation reuse are required shared semantics or later language/evaluation
material across the eighteen records. They are not separate source-declared
canonical records without lead-controller approval.

## Proposed Removals or Merges

None. The twelve state slots store different typed values, and the six
follow-up families perform different changes or continuations. Conversational
overlap does not authorize merging a carried state field with the language that
modifies it, merging detail with analysis, or collapsing comparison continuation
into a new comparison request.

---

# 5. Canonical Inventory Deliverable

**Batch status:** Canonical Batch 1 (`C15-CTX-001` through `C15-CTX-006`)
independently PASSed and was controller-accepted on 2026-08-11. Canonical Batch
2 (`C15-CTX-007` through `C15-CTX-012`) independently PASSed and was
controller-accepted on 2026-08-11. Canonical Batch 3 (`C15-CTX-013` through
`C15-CTX-018`) independently PASSed and was controller-accepted on 2026-08-11.
All eighteen canonical records are present, reviewed/PASS, `Planned`,
approved, and locked at Version 1. These batches authorize no context resolver, parser,
query, data access, provider call, mutation, or runtime capability.

**Batch-wide invariant:** Every record below belongs only to the latest accepted
query revision in the same server-authorized user/workspace/Journal-account
scope. A validator-accepted pending ambiguity is a separate privacy-safe track
that cannot mutate any accepted field. No record may be reconstructed from
prose, copied from stale context, supplied by a raw/private identifier, moved
across accounts, defaulted from missing data, or used to infer motive,
causation, advice, prediction, authorization, or runtime support.

Sort direction and finite result limit remain typed fields of the accepted
Category 14 ranking/query contract, not selected-object state. Metric,
gross/net/fee, currency, denominator, comparison, and display basis remain with
their locked metric owner and accepted `last_metric_or_metric_set` or
`active_comparison` contract. Selected-object records may retain the compatible
accepted query that uses those fields, but cannot define, infer, default, or
change them.

## `last_intent`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-001 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | last_intent |
| Display name | Last Intent |
| Exact definition | The accepted query state's typed primary intent and ordered secondary intents from the latest validator-accepted complete interpretation in this same conversation and server-authorized user/workspace/Journal-account scope. A validator-accepted `clarification_needed` outcome may create only the separate privacy-safe pending-ambiguity record tied to this unchanged accepted revision; it does not replace `last_intent`. Rejected, unsupported, unsafe, unvalidated, protected-action, or prose-inferred attempts cannot update it. |
| Distinction from related concepts | It carries the most recent accepted intent contract; it does not classify a new message, represent response detail, store a pending ambiguity, grant confirmation, authorize a protected action, or reconstruct intent from an answer/transcript. |
| Evidence classification | Directly observed as persisted accepted structured state and deterministically derived only from a schema-valid, validator-accepted complete interpretation. |
| Capability status | Planned |
| Result units | Typed primary-intent token, ordered secondary-intent tokens, accepted-state revision, and privacy-safe capability/coverage metadata; no analytical numeric unit. |
| Open-trade support | The state slot may retain an intent whose owning Category 1 and Journal contract explicitly supports `legitimate_open` facts; it never turns open, unresolved, or `needs_decision` records into eligible closed evidence. |
| Fee handling | Not applicable to intent state. Any retained money metric preserves its owning exact gross/net, fee, credit, currency, and coverage contract. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted structured conversation state.
- Narrower concepts: accepted primary intent and ordered accepted secondary intents.
- Commonly confused concepts: new-message intent classification,
  `response_detail_level`, and `unresolved_ambiguity`.
- Must not be merged with: `unresolved_ambiguity`, a protected-action
  confirmation, or a transcript-derived topic label.

## `last_metric_or_metric_set`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-002 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | last_metric_or_metric_set |
| Display name | Last Metric or Metric Set |
| Exact definition | The ordered locked metric concept or compatible metric set from the latest validator-accepted complete query revision in this conversation and server-authorized account scope, together with each metric's exact formula owner, result unit, gross/net and fee/credit basis, denominator, lifecycle population, currency partition or separately authorized conversion, sample/coverage contract, and any approved display basis. A pending ambiguity, answer prose, stale result, or rejected correction cannot replace it. |
| Distinction from related concepts | It carries accepted metric identity and all owning contracts; it does not calculate a value, define a formula, infer `profit`/`better` from prose, choose a hidden basis, perform `metric_modification`, or treat response formatting as a metric change. |
| Evidence classification | Directly observed as persisted accepted structured state and deterministically derived only after the metric/set and every compatible owning contract pass validation. |
| Capability status | Planned |
| Result units | Ordered canonical metric tokens plus typed formula-owner, unit, basis, denominator, population, currency, fee, sample, and coverage metadata; actual metric values remain deterministic tool results. |
| Open-trade support | Retains open-trade eligibility separately for each metric exactly as its locked owner defines it. It never substitutes `legitimate_open` values for closed-only metrics or includes `needs_decision` facts. |
| Fee handling | Retains each metric's selected exact gross/before-fee or fee-complete net/after-fee contract, charge costs, charge credits, currency partition, and partial/unavailable coverage; no fee default or gross/net substitution. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted structured conversation state.
- Narrower concepts: one accepted metric and an ordered compatible accepted
  metric set.
- Commonly confused concepts: `metric_modification`, response percentages,
  metric values, grouping, and comparison basis.
- Must not be merged with: a calculated result, answer prose, an unapproved
  balanced score, or `response_detail_level`.

## `active_date_range`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-003 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | active_date_range |
| Display name | Active Date Range |
| Exact definition | The Category 13-resolved temporal selection in the latest validator-accepted complete query revision: original temporal expression, selected accepted event basis, exact start/end or finite record-count window, boundary inclusivity, effective authorized IANA timezone, trusted server `as_of`, and local-calendar versus instant semantics. It remains bound to this conversation's server-authorized account and cannot be rebuilt from answer prose, browser/device/server-local time, or stale context. |
| Distinction from related concepts | It carries one accepted resolved time/window contract; it does not resolve a new phrase, calculate a duration, define a session/calendar, compare periods, perform `time_modification`, or infer `current`, `previous`, `now`, or event basis. |
| Evidence classification | Directly observed as persisted accepted state and deterministically derived from accepted UTC facts plus the locked Category 13 timezone, event, boundary, calendar/window, and trusted-`as_of` contracts. |
| Capability status | Planned |
| Result units | Typed local-calendar interval(s), UTC filter bounds or finite ordered-record count, effective IANA timezone, event basis, endpoint/inclusivity rules, trusted `as_of`, accepted-state revision, and coverage. |
| Open-trade support | Only when the selected event and owning metric/intent explicitly cover `legitimate_open` records. Missing endpoints and `needs_decision` records remain visible unavailable/decision coverage, not invented range matches. |
| Fee handling | Not applicable to temporal state. Any retained money metric keeps its exact fee, credit, gross/net, currency, and coverage contract unchanged. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted structured conversation state.
- Narrower concepts: accepted calendar range, rolling window, record-count
  window, and session/clock range.
- Commonly confused concepts: `time_modification`, hold duration,
  before-versus-after comparison, and visible page dates.
- Must not be merged with: browser/device time, a response display date, an
  unresolved relative phrase, or Category 14 period comparison.

## `active_filters`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-004 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | active_filters |
| Display name | Active Filters |
| Exact definition | The complete ordered, typed, schema-valid predicate expression from the latest validator-accepted query revision, including locked Category 11 fields, Category 12 operators, normalized typed operands, inclusion/exclusion/negation, grouping of boolean clauses, and explicit precedence. It is scoped to the same server-authorized account and eligible population. A pending ambiguity or proposed add/remove/replace/reset delta cannot partially mutate it before full-query acceptance. |
| Distinction from related concepts | It carries the accepted predicate tree; it does not define field truth, resolve an operand, perform `filter_modification`, silently choose precedence, treat a missing fact as false/zero, or copy filters from unrelated prose or another conversation/account. |
| Evidence classification | Directly observed as persisted accepted structured state and deterministically derived only after every field, operator, operand, boolean relation, authorization, compatibility, and coverage check passes. |
| Capability status | Planned |
| Result units | Ordered typed predicate tree with canonical fields/operators/operands, explicit boolean grouping/precedence, eligible-population contract, accepted-state revision, and coverage; no standalone analytical numeric unit. |
| Open-trade support | Each predicate retains its owning field/intent/metric eligibility. `legitimate_open`, closed, and `needs_decision` populations are never mixed or silently treated as matching/nonmatching when required data is absent. |
| Fee handling | A fee or money filter retains the owning exact amount/sign, charge-cost/credit, gross/net, currency, availability, and typed-operand contract; no estimated or missing fee is invented. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted structured conversation state.
- Narrower concepts: accepted inclusion, exclusion, negation, range,
  membership, and boolean-composed predicates.
- Commonly confused concepts: `filter_modification`, `active_grouping`,
  selected entities, and natural-language constraints not yet validated.
- Must not be merged with: a proposed filter delta, an unauthorized raw search
  value, a grouping, or a prose summary of filtered results.

## `active_comparison`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-005 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | active_comparison |
| Display name | Active Comparison |
| Exact definition | The complete Category 14 comparison contract from the latest validator-accepted query revision: typed left/right or candidate/baseline definitions, exact compatible metric and basis, separately defined authorized populations/partitions, units, currency and fee treatment, time/event basis, absolute or signed difference rule, optional meaningful nonzero percentage denominator, equality semantics, eligible sample counts, coverage, and limitations. No side, baseline, selected entity, denominator, or cause is inferred from prose. |
| Distinction from related concepts | It carries an accepted comparison specification; it does not calculate results, rank groups, resolve a selected entity or period, define similarity, continue the comparison, prove cause, or turn `better` into advice or future performance. |
| Evidence classification | Directly observed as persisted accepted structured state and deterministically derived only after both sides, metric/basis, populations, units, time, fee/currency, denominator, authorization, sample, and coverage contracts validate as compatible. |
| Capability status | Planned |
| Result units | Typed side/baseline definitions, canonical metric/basis and units, population/partition contracts, time/event and currency/fee contracts, difference/equality/percentage rules, eligible sample counts, accepted-state revision, coverage, and limitations; actual values remain deterministic results. |
| Open-trade support | Both sides retain identical compatible lifecycle eligibility under the owning metric. Closed-only metrics exclude legitimate open positions; open-supporting comparisons keep them explicit; `needs_decision` records never silently enter either side. |
| Fee handling | Money comparisons retain the exact selected gross/before-fee or fee-complete net/after-fee formula, charge costs/credits, compatible recorded-currency partitions or approved conversion, and partial/unavailable fee coverage for each side. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted structured conversation state.
- Narrower concepts: accepted group comparison, period comparison, selected-
  entity comparison, and explicit compatible baseline comparison.
- Commonly confused concepts: `comparison_continuation`, ranking,
  `active_grouping`, and an unresolved `better`/`difference` question.
- Must not be merged with: a calculated comparison result, causal explanation,
  recommendation, prediction, or pending ambiguity.

## `active_grouping`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-006 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | active_grouping |
| Display name | Active Grouping |
| Exact definition | The ordered authorized Category 11 grouping dimension or compatible grouping set and grain from the latest validator-accepted query revision, including typed bucket/definition versions, eligible population, missing/other/complement behavior, time/event basis, and coverage. It remains compatible with the accepted intent, metric, filters, comparison, date range, account, and privacy contract; answer prose, visible layout, raw IDs, or a stale selection cannot create or replace it. |
| Distinction from related concepts | It carries accepted group-by semantics; it does not filter rows, rank groups, define a dimension, perform `grouping_modification`, infer a bucket/complement, or treat the selected trade/ticker as a grouping without explicit validation. |
| Evidence classification | Directly observed as persisted accepted structured state and deterministically derived only after the grouping dimension(s), grain, definitions/versions, compatibility, authorization, missing-value behavior, and coverage validate. |
| Capability status | Planned |
| Result units | Ordered canonical grouping tokens, typed grain/bucket/definition metadata, eligible-population and missing/complement contracts, accepted-state revision, and coverage; grouped metric values retain their own units. |
| Open-trade support | Group membership follows the owning dimension plus metric/intent lifecycle contract. `legitimate_open`, closed, missing, and `needs_decision` coverage remain explicit and are not silently combined or assigned to an invented bucket. |
| Fee handling | Not applicable to grouping identity. Grouped money metrics retain their exact gross/net, fee/credit, currency, allocation, and coverage contracts without change. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted structured conversation state.
- Narrower concepts: one-dimensional grouping and ordered compatible multi-
  dimensional grouping.
- Commonly confused concepts: `grouping_modification`, `active_filters`, rank
  order, comparison sides, and selected-entity state.
- Must not be merged with: a filter, a ranked result, an inferred bucket, a raw
  identifier, or a presentation table layout.

## `selected_trade`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-007 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | selected_trade |
| Display name | Selected Trade |
| Exact definition | A trusted typed trade selection bound to the latest accepted state revision and this conversation's server-authorized user/workspace/Journal account. The server resolves and revalidates a privacy-safe opaque handle from an explicit authorized selection, trusted UI/page context, or another owning source allowed by the selected-entity contract, and retains its selection source, entity type, account binding, factual snapshot/provenance revision, and coverage. The model and trader-visible output never receive raw internal, execution, source, broker, or account identifiers. Prose proximity, answer text, recency, browser visibility, or an opaque handle alone cannot establish identity or authorization. |
| Distinction from related concepts | It identifies one authorized selected trade for later compatible queries; it does not retrieve raw trade rows, select a ticker/account by implication, define similarity, classify Day/Swing intent, rank the trade, infer a sort/limit/basis, or prove why the trade performed as it did. |
| Evidence classification | Directly observed from trusted typed selection context and deterministically bound only after server-side entity, account, provenance, scope, and current-coverage revalidation. |
| Capability status | Planned |
| Result units | Privacy-safe typed selected-entity binding: trade type, opaque server-resolved handle, trusted selection source, accepted-state revision, factual snapshot/provenance revision, account-scope binding, and coverage; no analytical numeric unit or raw ID. |
| Open-trade support | May reference a factually confirmed `legitimate_open` trade only when the selected-entity contract identifies it as open. Selection does not make closed-only metrics eligible, infer position intent, or admit `needs_decision` facts. |
| Fee handling | Selection does not choose or change a fee basis. Any query using the trade retains exact accepted charge costs/credits, gross/net basis, currency, allocation, and partial/unavailable coverage from the owning metric/fact contract. |
| Version | 1 |

### Related Concepts

- Broader concept: trusted selected-object conversation state.
- Narrower concepts: trusted explicit trade selection and trusted current-page
  trade selection.
- Commonly confused concepts: `selected_ticker`, a last/recent trade request,
  `selected_trade_versus_similar_trades`, and a raw execution/source row.
- Must not be merged with: a raw trade/execution ID, an inferred nearby trade,
  an unauthorized object, or `current_account`.

## `selected_ticker`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-008 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | selected_ticker |
| Display name | Selected Ticker |
| Exact definition | A trusted typed ticker selection bound to the latest accepted state revision and this conversation's server-authorized user/workspace/Journal-account scope. It contains the normalized authorized ticker value plus privacy-safe selection source, scope, factual snapshot/provenance revision, and coverage only after explicit input or trusted UI/page context is server-validated. It does not inherit a ticker from visible prose, an unrelated prior answer, a stale selected trade, another account, or a browser/device guess. |
| Distinction from related concepts | It carries one authorized ticker selection; it does not identify a particular trade/journal entry, create an `all other tickers` complement, select a grouping, expose a raw security/source identifier, or infer rank direction, result limit, metric, basis, or advice. |
| Evidence classification | Directly observed from an explicit or trusted typed ticker selection and deterministically normalized/revalidated against authorized factual scope and provenance. |
| Capability status | Planned |
| Result units | Normalized ticker token with trusted selection source, accepted-state revision, factual snapshot/provenance revision, account-scope binding, and coverage; no private/raw identifier or analytical numeric unit. |
| Open-trade support | A ticker may be selected whether its authorized facts include closed trades, `legitimate_open` positions, both, or neither. Each later metric/filter retains its own lifecycle eligibility; selection never hides `needs_decision` coverage. |
| Fee handling | Not applicable to ticker identity. Money results retain the owning exact gross/net, fee/credit, currency, allocation, and availability contract. |
| Version | 1 |

### Related Concepts

- Broader concept: trusted selected-object conversation state.
- Narrower concepts: explicit ticker selection and trusted current-page ticker
  selection.
- Commonly confused concepts: `selected_trade`, ticker grouping/filtering, and
  `one_ticker_versus_all_other_tickers`.
- Must not be merged with: an internal security ID, broker instrument ID,
  inferred nearby ticker, grouping dimension, or account scope.

## `selected_journal_entry`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-009 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | selected_journal_entry |
| Display name | Selected Journal Entry |
| Exact definition | A trusted typed reference to one authorized accepted Journal entry, bound to the latest accepted state revision and this conversation's server-authorized user/workspace/Journal account. The state retains only a privacy-safe opaque server-resolved handle, entry type/date where permitted, trusted selection source, owning factual snapshot/provenance revision, and coverage. Private note text, raw source content, internal IDs, broker/account identifiers, and another account's entry never become selection state or operational-log values. Any content supplied to a model must come separately from the minimum approved account-scoped factual package. |
| Distinction from related concepts | It identifies an authorized Journal object; it does not copy its text into state, infer a selected trade/ticker, create or edit a note/tag/review, expose provenance rows, change a Current Focus, or authorize a protected action. |
| Evidence classification | Directly observed from trusted typed Journal selection context and deterministically bound only after server-side type, ownership, account, provenance, and current-coverage revalidation. |
| Capability status | Planned |
| Result units | Privacy-safe typed Journal-entry binding: entry type, opaque server-resolved handle, permitted date metadata, selection source, accepted-state revision, factual snapshot/provenance revision, account-scope binding, and coverage; no raw ID or copied private text. |
| Open-trade support | Journal-entry selection is independent of trade lifecycle. If the entry references an open or decision-incomplete trade, later tools must preserve the owning lifecycle and coverage contract and cannot treat the entry as completed-trade proof. |
| Fee handling | Not applicable to Journal-entry identity. Referenced trade analysis retains its exact fee/credit, gross/net, currency, allocation, and availability contract; note prose cannot override it. |
| Version | 1 |

### Related Concepts

- Broader concept: trusted selected-object conversation state.
- Narrower concepts: selected daily note, reflection, saved review, or other
  authorized typed Journal entry where the owning product permits it.
- Commonly confused concepts: `selected_trade`, saved review context, raw note
  text, and a draft/protected Journal action.
- Must not be merged with: private entry content, raw/internal/source ID,
  assistant-created note, or `current_account`.

## `current_account`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-010 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | current_account |
| Display name | Current Account |
| Exact definition | The server-owned authorization boundary that permanently binds one conversation and every accepted/pending context record to one verified Platform user, workspace, and selected Journal account. It is established through the normal authenticated/account-selection contract and revalidated on every turn; user prose, a client value, selected entity, conversation/object handle, browser state, model output, or prompt injection cannot create, move, or broaden it. Switching the product's selected account requires a separately authorized account-scoped conversation/context flow rather than transferring this conversation's state or private history. |
| Distinction from related concepts | It is an access boundary, not an analytical filter/group, trader-facing account number, broker identity, selected object, conversation ID, model-visible credential, or user-correctable query field. |
| Evidence classification | Directly observed only from server-verified Platform identity, workspace access, Journal-account selection, and authorization revision; never derived from conversation language. |
| Capability status | Planned |
| Result units | Server-internal privacy-safe authorization binding and revision for user/workspace/Journal-account scope; model/trader output receives no raw subject, workspace, account, broker, credential, or permission identifier. |
| Open-trade support | The account boundary scopes all lifecycle populations but does not change their status. `ready_closed`, `legitimate_open`, and `needs_decision` coverage remain distinct under their owning Journal contracts. |
| Fee handling | The account boundary does not select fee treatment. Each accepted metric/query retains exact account-scoped fee/credit, currency, allocation, completeness, and availability rules. |
| Version | 1 |

### Related Concepts

- Broader concept: server-authorized conversation scope.
- Narrower concepts: verified Platform-user, workspace-access, and selected-
  Journal-account bindings.
- Commonly confused concepts: account filter/grouping, account selector UI,
  conversation ID, broker account number, and selected-object scope.
- Must not be merged with: a user-entered account label, raw authorization ID,
  provider credential, another account's history, or `selected_trade`.

## `response_detail_level`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-011 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | response_detail_level |
| Display name | Response Detail Level |
| Exact definition | The accepted Category 18 response-mode token retained for the latest accepted query revision: `brief`, `standard`, `detailed`, `table`, `coach`, or `audit`. An explicit validated user request or the owning Category 18 default contract may select it. It changes only presentation/evidence depth and cannot alter the accepted intent, metric, basis, fee/currency treatment, filters, date range, grouping, comparison, sort direction, finite result limit, sample counts, factual snapshot, authorization, coverage, or safety policy. A pending ambiguity does not replace it. |
| Distinction from related concepts | It carries an accepted presentation preference; it is not `detail_modification`, an analytics metric, result limit, ranking detail, evidence authorization, causal-explanation permission, coaching advice, or a source of additional facts. |
| Evidence classification | Directly observed as persisted accepted state and user-labelled when explicitly selected; any default is deterministically supplied only by the locked Category 18 contract, never inferred from prose length or device/UI behavior. |
| Capability status | Planned |
| Result units | One locked Category 18 response-mode token plus accepted-state revision and applicable presentation/evidence constraints; no analytical numeric unit. |
| Open-trade support | Presentation mode cannot change lifecycle eligibility. Any open-trade material must already be authorized and supported by the accepted query/result contract with visible coverage. |
| Fee handling | Presentation mode cannot alter, omit when material, estimate, or substitute the accepted exact gross/net, fee/credit, currency, allocation, and availability contract. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted structured conversation state.
- Narrower concepts: the six locked Category 18 response modes.
- Commonly confused concepts: `detail_modification`, result limit, response
  length, evidence access, and coaching intent.
- Must not be merged with: metric basis, sort/limit, clarification state,
  protected-action permission, or answer truth.

## `unresolved_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-012 |
| Category | Context and Conversation Language |
| Subcategory | Structured conversation state |
| Canonical name | unresolved_ambiguity |
| Display name | Unresolved Ambiguity |
| Exact definition | A separate typed, privacy-safe pending record created only by a validator-accepted `clarification_needed` outcome. It records the single highest-impact unresolved field, privacy-safe typed candidate kinds or allowed choices, focused clarification question, originating conversation/message reference, and the unchanged accepted-state revision it is testing. It supplies no accepted query value and cannot replace or partially mutate intent, metric/basis, filters, time, comparison, grouping, selection, account, response mode, sort direction, or result limit. A validator-accepted complete clarification atomically clears the pending marker and creates the next complete accepted query revision. A validator-accepted still-ambiguous `clarification_needed` outcome atomically replaces only the pending marker while the accepted query revision remains unchanged. Rejected, unsafe, unsupported, or unvalidated answers update neither track; stale, mismatched, unauthorized, or cross-account answers cannot resolve it. |
| Distinction from related concepts | It is a pending clarification contract, not an accepted query field/value, low-confidence guess, hidden default, transcript note, error log, unsupported result, or permission to execute a tool/write. |
| Evidence classification | Deterministically derived only from a validator-accepted `clarification_needed` outcome over the unchanged accepted query revision; it is not a Journal fact or prose-derived state. |
| Capability status | Planned |
| Result units | Privacy-safe typed unresolved-field token, allowed candidate kinds/choices, one focused question, opaque/digested originating reference, unchanged accepted-state revision, and pending-marker revision/status; no raw private value or analytical unit. |
| Open-trade support | Not a trade population. If ambiguity concerns lifecycle, the marker may identify only the typed unresolved lifecycle field/allowed choices; it cannot classify an open position, admit `needs_decision` facts, or alter eligibility. |
| Fee handling | If ambiguity concerns metric or fee basis, the marker records only the typed unresolved basis/allowed choices. It cannot choose gross/net, invent fees/credits, assume completeness, combine currencies, or mutate the accepted metric contract. |
| Version | 1 |

### Related Concepts

- Broader concept: two-track structured conversation state.
- Narrower concepts: pending referent, metric/basis, filter, time, grouping,
  comparison, selection, sort, limit, or response-mode clarification.
- Commonly confused concepts: an accepted state field, validator error,
  unsupported capability, confidence score, and `clarificationExpected`.
- Must not be merged with: a guessed/default query value, rejected attempt,
  private transcript text, execution permission, or accepted query revision.

**Follow-up-family invariant:** Each record below first identifies a unique
compatible accepted query/result revision through trusted typed context.
Pronouns and references such as `that`, `it`, `this`, `those`, and `same` may
resolve only to that unique authorized candidate; otherwise the message is a
new question or produces one focused pending clarification. Every explicit
field change is a typed add/remove/replace/retain/reset delta owned by the
locked category for that field. A correction replaces its contradicted target
and never accumulates a hidden second meaning. The complete resulting query
must validate before one atomic accepted-state revision is created; a validated
still-ambiguous outcome updates only the separate pending marker, and a
rejected, unsafe, unsupported, or unvalidated attempt updates neither track.

## `filter_modification`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-013 |
| Category | Context and Conversation Language |
| Subcategory | Follow-up modification |
| Canonical name | filter_modification |
| Display name | Filter Modification |
| Exact definition | Interpret a follow-up such as `Only long trades`, `Remove premarket`, `Just trades under $3`, or `Exclude AAPL` as an explicit typed delta against the `active_filters` predicate tree from one uniquely identified accepted query revision in this conversation and server-authorized account. Category 12 owns field/operator/operand meaning and add/remove/replace/retain/reset behavior. `No, I meant...` replaces the contradicted target predicate rather than retaining both meanings; `remove` must identify an existing compatible predicate; `only`/`just` may add a restriction only when precedence and retained predicates stay explicit and nonconflicting. The complete query validates before atomic acceptance. Without a unique compatible prior filter/query target, interpret the message as a new question or ask one focused clarification rather than silently carrying context. |
| Distinction from related concepts | It changes accepted filter state only; it does not define a dimension/operator, change grouping, infer a metric/time/basis/sort/limit, treat missing facts as false/zero, copy filters from prose, or turn a selected entity into a filter without validation. |
| Evidence classification | Directly observed as explicit follow-up/correction language and deterministically derived as a typed Category 12-owned filter delta only after reference, authorization, compatibility, conflict, and full-query validation. |
| Capability status | Planned |
| Result units | Typed filter delta with operation, canonical field/operator/operand, exact target predicate where replacing/removing, retained predicate tree/precedence, source accepted-state revision, proposed next revision, and coverage; no analytical numeric unit or raw identifier. |
| Open-trade support | The delta preserves each field/metric/intent lifecycle contract. It cannot silently include or exclude `legitimate_open` or `needs_decision` records, and absent required data remains partial/unavailable rather than false. |
| Fee handling | A fee/money filter retains the locked amount/sign, gross/net, charge-cost/credit, currency, completeness, and typed-operand contract. Missing or partial fee data is not invented, and a correction replaces rather than stacks a contradicted fee basis. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted-query follow-up modification.
- Narrower concepts: add filter, remove filter, replace/correct filter, retain
  filters, and reset filters.
- Commonly confused concepts: `active_filters`, `grouping_modification`, a new
  retrieval question, and an unvalidated natural-language constraint.
- Must not be merged with: a filter result, hidden predicate accumulation,
  grouping, selected-object state, or Category 12 operator meaning.

## `time_modification`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-014 |
| Category | Context and Conversation Language |
| Subcategory | Follow-up modification |
| Canonical name | time_modification |
| Display name | Time Modification |
| Exact definition | Interpret a follow-up such as `What about last month?`, `Now do the last 90 days`, or `Only this week` as an explicit replace/narrow/reset delta against the `active_date_range` of one uniquely identified accepted query revision. Category 13 must first resolve the new expression to exact event basis, boundaries, effective authorized IANA timezone, trusted server `as_of`, and calendar/rolling/count-window semantics. `No, I meant June` replaces the contradicted range; it does not retain a hidden intersection with the old range. Compatible intent, metric, filters, grouping, comparison, basis, sort, and limit may be retained only when explicitly valid. Full-query validation precedes atomic acceptance; missing prior target or unresolved temporal contract makes the message a new question or focused clarification. |
| Distinction from related concepts | It modifies an accepted temporal selection; it does not define dates/sessions/timezones, calculate duration, compare two periods, infer a clock/event/year, use browser/device/server-local time, or rewrite a stale result. |
| Evidence classification | Directly observed as explicit follow-up/correction language and deterministically derived as a typed Category 13-resolved temporal delta only after reference, authorization, event/timezone/as-of/boundary, compatibility, and full-query validation. |
| Capability status | Planned |
| Result units | Typed time delta with replace/narrow/reset operation, exact resolved local/UTC bounds or finite ordered-record count, event basis, timezone, trusted `as_of`, endpoints, source accepted-state revision, proposed next revision, and coverage. |
| Open-trade support | Retains open-trade eligibility only when the selected event and owning metric/intent cover it. Missing endpoints and `needs_decision` facts remain visible coverage and cannot be forced into the new period. |
| Fee handling | Temporal change does not alter fee treatment. Retained money metrics keep their exact gross/net, fee/credit, currency, allocation, and availability contract. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted-query follow-up modification.
- Narrower concepts: replace period, narrow period, correct period, and reset
  period.
- Commonly confused concepts: `active_date_range`, before-versus-after
  comparison, hold duration, and a new standalone date query.
- Must not be merged with: Category 13 temporal resolution, browser/device
  context, stale `as_of`, or hidden date-range intersection.

## `metric_modification`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-015 |
| Category | Context and Conversation Language |
| Subcategory | Follow-up modification |
| Canonical name | metric_modification |
| Display name | Metric Modification |
| Exact definition | Interpret a follow-up such as `Use net profit instead`, `What about expectancy?`, or `Show percentages` as an explicit replace/add/remove/basis/display delta against `last_metric_or_metric_set` from one uniquely identified accepted query revision. The owning Categories 2-10 define canonical metric, formula, unit, denominator, gross/net and fee/credit basis, currency, lifecycle population, sample, and coverage; Category 15 cannot change them. `Instead` and an explicit correction replace the contradicted metric/basis rather than silently retaining both; adding a metric requires explicit additive wording and compatibility. `Show percentages` selects only an approved percentage metric/representation with a meaningful denominator and never changes response detail alone. Dependent comparison, grouping, filter, sort direction, finite result limit, and basis fields must validate or be explicitly reset/clarified before atomic acceptance. |
| Distinction from related concepts | It changes the accepted metric/set or approved basis/representation; it does not calculate a value, invent a formula/denominator, alter result truth through presentation, choose a hidden gross/net or percentage basis, or infer `profit`, `better`, or `performance` from prose. |
| Evidence classification | Directly observed as explicit follow-up/correction language and deterministically derived as a typed locked-metric delta only after formula-owner, unit, denominator, fee/currency, lifecycle, sample, coverage, authorization, dependency, and full-query validation. |
| Capability status | Planned |
| Result units | Typed metric delta with operation, ordered canonical metric token(s), exact formula owner/unit/basis/denominator/fee/currency/population/sample contracts, affected dependent fields, source accepted-state revision, proposed next revision, and coverage; actual values remain deterministic tool results. |
| Open-trade support | Each replacement/addition retains its locked lifecycle eligibility. Open-supporting and closed-only metrics cannot be combined without an explicit compatible population contract, and `needs_decision` facts remain excluded/visible. |
| Fee handling | Gross/before-fee versus fee-complete net/after-fee selection, charge costs/credits, currency partition/conversion, allocation, and partial/unavailable coverage remain exact owning inputs. No hidden basis default, fee estimate, or contradicted-basis accumulation is allowed. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted-query follow-up modification.
- Narrower concepts: replace metric, add/remove metric, correct metric basis,
  and select approved percentage representation.
- Commonly confused concepts: `last_metric_or_metric_set`,
  `response_detail_level`, `detail_modification`, and comparison continuation.
- Must not be merged with: a calculated value, presentation-only request,
  hidden metric accumulation, or an invented formula/basis.

## `grouping_modification`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-016 |
| Category | Context and Conversation Language |
| Subcategory | Follow-up modification |
| Canonical name | grouping_modification |
| Display name | Grouping Modification |
| Exact definition | Interpret a follow-up such as `Break that down by weekday`, `Now group it by ticker`, or `Separate premarket and regular hours` as an explicit add/replace/remove/refine/reset delta against `active_grouping` from one uniquely identified accepted query revision. `That` and `it` must resolve to the same unique compatible accepted result/query, not nearby prose. Category 11 owns authorized grouping dimensions, typed bucket/definition versions, grain, complement/missing behavior, eligible population, and coverage. `Now group it by ticker` replaces the prior grouping unless the user explicitly requests an additional compatible level; a correction replaces the contradicted grouping rather than accumulating both. Metric, filters, time, comparison, basis, sort, and finite limit must remain compatible through full-query validation before atomic acceptance. |
| Distinction from related concepts | It changes accepted group-by structure; it does not define a dimension/bucket, filter rows, rank groups, infer a session/calendar, use selected objects as groups, or derive grouping from a table/prose layout. |
| Evidence classification | Directly observed as explicit follow-up/correction language and deterministically derived as a typed Category 11-owned grouping delta only after reference, dimension/grain/version, authorization, compatibility, missing/complement, coverage, and full-query validation. |
| Capability status | Planned |
| Result units | Typed grouping delta with operation, ordered canonical dimension(s), grain/bucket/definition version, missing/complement/population rules, affected dependent fields, source accepted-state revision, proposed next revision, and coverage; grouped values retain their own metric units. |
| Open-trade support | Group membership preserves the owning dimension plus metric/intent lifecycle contract. Closed, `legitimate_open`, missing, and `needs_decision` populations cannot be silently combined or assigned to invented buckets. |
| Fee handling | Grouping change does not alter fee treatment. Grouped money metrics retain exact gross/net, fee/credit, currency, allocation, completeness, and coverage contracts. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted-query follow-up modification.
- Narrower concepts: add grouping level, replace grouping, remove grouping,
  refine grain, and reset grouping.
- Commonly confused concepts: `active_grouping`, `filter_modification`, rank
  order, comparison sides, and presentation tables.
- Must not be merged with: a filter, inferred bucket, hidden multi-level
  accumulation, selected-object state, or Category 11 dimension meaning.

## `detail_modification`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-017 |
| Category | Context and Conversation Language |
| Subcategory | Follow-up modification |
| Canonical name | detail_modification |
| Display name | Detail Modification |
| Exact definition | Interpret a follow-up such as `Show me the trades`, `Give me more detail`, `Just give me the answer`, or `Explain how you calculated it` as a typed response-mode/evidence-depth delta that targets one uniquely identified accepted query and immutable accepted result/factual snapshot revision. `It`, `that`, and `the answer` must resolve to that unique compatible result. Category 18 owns response mode, while the accepted query/result owners retain metric, population, filters, grouping, comparison, time, basis, sort direction, finite result limit, exact values, sample counts, coverage, and limitations. Explanation restates only the accepted deterministic formula/evidence; it cannot recalculate against a different population, change query truth, add hidden analysis, infer motive/cause, give advice, or turn prior prose into proof. Bounded evidence links require current authorization/privacy revalidation and no raw IDs. |
| Distinction from related concepts | It changes presentation or bounded evidence depth only; it does not modify analytical fields, request a new calculation by implication, authorize raw/private evidence, alter sample adequacy, create a coaching conclusion, or serve as `comparison_continuation`. |
| Evidence classification | Directly observed as explicit detail/explanation follow-up language and deterministically derived as a typed Category 18 response/evidence delta only after unique-result provenance, authorization, privacy, capability, and result-contract validation. |
| Capability status | Planned |
| Result units | Typed response-mode/evidence-depth delta, privacy-safe accepted result/snapshot reference, unchanged query-contract digest, source accepted-state revision, proposed next presentation-state revision, and required coverage/limitations; analytical result units remain unchanged. |
| Open-trade support | Detail mode cannot change lifecycle eligibility. Trade evidence may include `legitimate_open` objects only when already authorized and supported by the accepted result; it cannot convert them into closed evidence or expose `needs_decision` content as fact. |
| Fee handling | Detail/explanation must preserve and, when material, state the accepted gross/net, fee/credit, currency, allocation, and completeness contract exactly; it cannot omit a material fee limitation or select another basis. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted-result follow-up modification.
- Narrower concepts: show bounded supporting trades, expand detail, reduce to
  direct answer, and explain accepted calculation.
- Commonly confused concepts: `response_detail_level`, metric modification,
  new evidence retrieval, why/causation questions, and comparison continuation.
- Must not be merged with: query-field modification, unrestricted evidence
  access, raw identifiers, causal explanation, advice, or a new analysis.

## `comparison_continuation`

| Field | Value |
|---|---|
| Inventory ID | C15-CTX-018 |
| Category | Context and Conversation Language |
| Subcategory | Follow-up continuation |
| Canonical name | comparison_continuation |
| Display name | Comparison Continuation |
| Exact definition | Interpret a follow-up such as `Which one is more consistent?`, `What caused the difference?`, or `Is the sample large enough?` only against one uniquely identified accepted `active_comparison` and its immutable accepted result/factual snapshot revision. `One`, `the difference`, `the sample`, `that`, `it`, and `same` must resolve to the exact compatible sides/result; otherwise start a new question or ask one focused clarification. A requested new comparison metric is an explicit validated `metric_modification`, not a hidden reinterpretation. Cause wording returns only supported direct mechanism or bounded association/unknown-cause language, never motive or causal invention. Sample-size continuation retains and revalidates the exact accepted result's eligible side populations, counts, exclusions, coverage, and limitations; adequacy thresholds/interpretation remain with the locked metric/policy owner and cannot be inferred from prose, a stale result, or the word `sample`. Any resulting typed delta validates before atomic acceptance. |
| Distinction from related concepts | It continues an accepted comparison/result; it does not create comparison sides, silently select another metric/baseline/population, rank results, change sort/limit/basis, prove cause, determine universal sample adequacy, advise trading, or reuse an unrelated prior answer. |
| Evidence classification | Directly observed as explicit continuation language and deterministically derived only after unique comparison/result provenance, metric/side/population compatibility, authorization, current coverage, sample-contract, causation-policy, and full-query/result validation. |
| Capability status | Planned |
| Result units | Typed continuation request linked to privacy-safe accepted comparison/result/snapshot provenance, exact side definitions, metric/basis/units, eligible side counts/populations/exclusions, coverage/limitations, requested continuation kind, source accepted-state revision, and any validated proposed delta; no raw ID. |
| Open-trade support | Retains identical compatible lifecycle eligibility for both accepted sides. It cannot add open positions to a closed-only comparison, hide `legitimate_open` coverage, or admit `needs_decision` facts as completed evidence. |
| Fee handling | Retains the accepted exact gross/net, fee/credit, currency, allocation, and completeness contract for both sides. A continuation cannot silently change basis; an explicit basis correction routes through validated `metric_modification`. |
| Version | 1 |

### Related Concepts

- Broader concept: accepted-result follow-up continuation.
- Narrower concepts: compare another compatible metric, explain supported
  difference boundary, and assess sample/coverage under an owning contract.
- Commonly confused concepts: `active_comparison`, a new compare request,
  metric modification, detail/explanation, and causal diagnosis.
- Must not be merged with: a hidden comparison change, generic why answer,
  universal sample threshold, recommendation, prediction, or causal claim.

## Canonical Inventory Production Summary

All 18/18 exact source-order canonical records are complete Version 1
`Planned` records. Batches 1-3 independently PASSed, and the lead controller
approved and locked all 18 exact canonical names on 2026-08-11. This approval
does not authorize runtime capability.

---

# 6. Language Registry Deliverable

**Batch status:** Registry Batch 1 (`C15-CTX-001` through `C15-CTX-006`)
independently PASSed and was controller-accepted on 2026-08-11. Registry Batch 2
(`C15-CTX-007` through `C15-CTX-012`) independently PASSed and was controller-
accepted on 2026-08-11. Registry Batch 3 contains the final six complete
registries in exact inventory order, `C15-CTX-013` through `C15-CTX-018`, and
independently PASSed before controller acceptance. All 18 registries are now
reviewed/PASS, `Planned`, approved, and locked at Version 1. Every
compatible intent below uses only an exact locked Category 1 canonical name. No
registry authorizes runtime capability.

## `last_intent` Language Registry

### Exact Definition

The exact accepted primary intent and ordered secondary intents from the latest
complete validator-accepted query revision in the same authorized conversation
and Journal-account scope. Prose, stale turns, pending ambiguity, rejected
attempts, and protected actions cannot replace it.

### Formal Wording

- "Retain the intent from my last accepted request and change only the period."

### Normal Conversational Wording

- "Do the same kind of analysis for June."

### Trader Slang

- "Run that same breakdown back for my afternoon trades."

### Abbreviations

- "same req, last 30d"

### Common Misspellings

- "same intnet as the last one"

### Noisy or Incomplete Input

- "same thing but june"

### Singular and Plural Forms

- Singular: "the last intent"; plural: "the last primary and secondary intents."

### Full Questions

- "Can you use the same request as before but look at this week?"

### Commands

- "Keep the same intent and exclude premarket trades."

### Sentence Fragments

- "same request, different month"

### Follow-Up Wording

- "What about July?" retains `last_intent` only when one compatible accepted
  query is uniquely identified; the time change belongs to `time_modification`.

### Correction Wording

- "No, keep the same analysis request; I only meant to change the ticker."

### Comparison Wording

- "Compare them the same way, but use June and July."

### Ranking Wording

- "Rank them the same way as the accepted result, but for this month."

### Negated Wording

- "Don't change what I asked you to do; only change the period."

### Exclusion Wording

- "Use the same request and exclude AAPL."

### Multi-Filter Wording

- "Same request, only long trades under $5 and not premarket."

### Multi-Part Question Wording

- "Use the same analysis for June, then show the accepted result in a table."

### Ambiguous Wording

- "Do that again" is ambiguous when more than one accepted request or result is
  a compatible referent.

### Negative Examples

These examples must not map to `last_intent`.

- "What does intent mean?" maps to `explain_concept`, not prior-intent state.
- "Start a new analysis of my last trade" supplies a new `analyze_trade`
  request rather than retaining the last intent.

### Context Requirements

Require one latest complete accepted query revision in the same conversation,
its exact locked Category 1 primary/secondary intents, unchanged authorized
user/workspace/Journal-account binding, and a unique compatible reference.
Structured state outranks transcript prose; a pending marker never supplies the
intent.

### Required Data

- Accepted-state revision; locked intent tokens; conversation/account binding;
  validation status; capability status; and privacy-safe provenance.

### Optional Data

- Trusted current-page context and the accepted result-contract digest may help
  distinguish a unique compatible referent without exposing raw IDs.

### Valid Filters

- Any already accepted filters may be retained unchanged; filter meaning and
  deltas remain owned by Category 12 and `filter_modification`.

### Valid Groupings

- Any already accepted compatible grouping may be retained unchanged;
  grouping meaning and changes remain owned by Category 11 and
  `grouping_modification`.

### Valid Operators

- Context operation: retain the accepted intent while a separately typed field
  delta changes; no query predicate operator is defined here.

### Compatible Intents

- All exact locked Category 1 intents may be carried when already accepted:
  `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `explain_concept`, `inspect_data_quality`,
  `assist_journaling`, `product_help`, `unsupported_request`,
  `prepare_manual_execution_draft`, `prepare_user_setting_change`, and
  `assist_daily_review`.

### Incompatible Combinations

- Cross-account carryover, an unaccepted or stale turn, raw-ID selection,
  hidden protected-action confirmation, conflicting new explicit intent, or a
  follow-up whose target cannot be uniquely resolved.

### Default Interpretation

Retain `last_intent` only when the user clearly modifies another field of one
unique compatible accepted query. There is no default intent for an isolated
fragment, new question, ambiguous pronoun, rejected turn, or missing state.

### Clarification Conditions

Clarify when no accepted query exists, multiple compatible accepted targets
exist, or explicit new wording conflicts with the retained intent.

### Recommended Clarification Wording

- "Which earlier request do you want me to continue?"

### Unsupported Conditions

- Missing/unauthorized conversation state, cross-account history, stale or
  invalid accepted revision, unknown/nonlocked intent, or unavailable required
  context returns clarification or unsupported state without invention.

### Target Analytics Tool or Query Capability

- Future bounded context resolver followed by the structured-query validator;
  only an already approved deterministic tool for the retained locked intent
  could execute later. No Chat runtime exists here.

### Result Units

- Locked primary-intent token, ordered secondary-intent tokens, accepted-state
  revision, capability/coverage status, and privacy-safe provenance.

### Fee Handling

- Intent retention never changes fees. Any money metric preserves its exact
  gross/net, charge-cost/credit, currency, completeness, and coverage contract.

### Open-Trade Handling

- Retention preserves the owning intent/metric lifecycle eligibility; it never
  turns `legitimate_open` or `needs_decision` records into closed evidence.

### Sample-Size Considerations

- Intent state has no sample threshold. A retained analytical request must keep
  its exact eligible population, counts, coverage, and owning metric/policy
  limitation; prose cannot assert adequacy.

## `last_metric_or_metric_set` Language Registry

### Exact Definition

The ordered locked metric concept or compatible metric set and every owning
formula, unit, basis, denominator, fee/currency, lifecycle, sample, and coverage
contract from the latest accepted query revision. It is accepted typed state,
not a metric guessed from answer prose.

### Formal Wording

- "Retain the accepted metric set while changing the analysis period."

### Normal Conversational Wording

- "Use the same numbers, but only for June."

### Trader Slang

- "Same P&L stats, just my morning trades."

### Abbreviations

- "same NPnL + WR, last 30d"

### Common Misspellings

- "keep the same metrcs as befor"

### Noisy or Incomplete Input

- "same stats june only"

### Singular and Plural Forms

- Singular: "the same metric"; plural: "the same metrics" or "metric set."

### Full Questions

- "Can you keep net P&L and win rate but use last month instead?"

### Commands

- "Keep the accepted metrics and group them by ticker."

### Sentence Fragments

- "same metrics, different filter"

### Follow-Up Wording

- "What about this week?" may retain the accepted metric/set when one
  compatible accepted query is unique; the new range is `time_modification`.

### Correction Wording

- "No, keep net P&L; I was correcting the date, not the metric."

### Comparison Wording

- "Use those same metrics to compare long and short trades."

### Ranking Wording

- "Rank tickers by the same accepted metric and basis."

### Negated Wording

- "Don't switch the metric; only remove premarket."

### Exclusion Wording

- "Same metrics, excluding trades with incomplete fee coverage."

### Multi-Filter Wording

- "Keep net P&L and win rate for long trades under $5 outside premarket."

### Multi-Part Question Wording

- "Use the same metrics for June and explain the accepted calculation."

### Ambiguous Wording

- "Use the same stats" is ambiguous when the accepted query contains multiple
  metric sets/bases or more than one prior result is a compatible referent.

### Negative Examples

These examples must not map to `last_metric_or_metric_set`.

- "Use expectancy instead" maps to `metric_modification`.
- "Make the answer shorter" maps to `detail_modification`, not metric state.

### Context Requirements

Require one uniquely referenced latest accepted query, its ordered locked
metric/set and complete owning contracts, unchanged authorized account scope,
and current capability/coverage. Pending ambiguity, stale result text, or raw
IDs cannot supply the metric.

### Required Data

- Accepted-state revision; canonical metric token(s); formula owner; units;
  basis/denominator; fee/currency/lifecycle/sample/coverage contracts; account
  binding; and validation status.

### Optional Data

- Accepted result-contract digest and privacy-safe evidence summary may confirm
  compatibility without reconstructing metrics from prose.

### Valid Filters

- Retain any accepted filters compatible with every metric; field/operator
  changes remain owned by Category 12 and `filter_modification`.

### Valid Groupings

- Retain accepted groupings only when each metric supports their grain,
  population, units, and coverage.

### Valid Operators

- Context operation: retain the ordered metric/set; replacement/addition/removal
  belongs to `metric_modification`, not this state record.

### Compatible Intents

- `summarize_performance`, `calculate_metric`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `detect_pattern`, `explain_result`,
  `diagnose_performance`, `identify_strengths`, `evaluate_rule`,
  `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `inspect_data_quality`, and `assist_daily_review` when
  their accepted contract contains the retained metric(s).

### Incompatible Combinations

- Incompatible units/populations/denominators, hidden gross/net or FX change,
  stale/rejected state, cross-account carryover, prose-derived metric, unknown
  metric, or retention after an explicit contradictory replacement.

### Default Interpretation

Retain the exact accepted metric/set only when another field is explicitly
modified and compatibility remains valid. No default metric, basis, denominator,
fee state, currency conversion, sample population, or metric set exists. Never
infer the basis from prose, the selected metric, a prior answer, or a stale
result.

### Clarification Conditions

Clarify first when the prior accepted query/result target is not unique. After
one accepted target is selected, ask which accepted metric should remain when
the metric is unresolved or retained metrics are incompatible with the requested
field delta. Only after that metric is selected, if its locked contract still
permits more than one materially different basis, ask a separate later focused
basis question; never infer the basis.

### Recommended Clarification Wording

- "Which accepted metric should stay in this follow-up?"

### Unsupported Conditions

- Missing accepted metric contract, unknown/unlocked metric, incompatible
  metric set, absent denominator/basis, incomplete required fee/currency facts,
  stale revision, unauthorized scope, or unavailable capability.

### Target Analytics Tool or Query Capability

- Future context resolver plus structured-query/metric-contract validator; the
  owning approved deterministic metric tool only after validation. No runtime
  capability is authorized.

### Result Units

- Ordered metric tokens with exact formula/unit/basis/denominator/fee/currency/
  lifecycle/sample/coverage metadata and accepted-state revision; values remain
  deterministic tool output.

### Fee Handling

- Preserve the accepted exact gross/before-fee or fee-complete net/after-fee
  contract, charge costs/credits, currency, allocation, and limitations. Never
  infer or substitute a fee basis.

### Open-Trade Handling

- Preserve each metric's locked lifecycle eligibility; do not combine open-
  supported and closed-only populations or admit `needs_decision` facts.

### Sample-Size Considerations

- Retain each metric's exact eligible population/counts, exclusions, coverage,
  and owning limitations. Metric state never declares a sample adequate from
  prose or a stale result.

## `active_date_range` Language Registry

### Exact Definition

The exact Category 13-resolved date/time/window contract in the latest accepted
query revision, including event basis, bounds/count, inclusivity, effective IANA
timezone, trusted server `as_of`, calendar/window semantics, and coverage.

### Formal Wording

- "Retain the accepted temporal range while changing the grouping dimension."

### Normal Conversational Wording

- "Keep the same dates and break it down by ticker."

### Trader Slang

- "Same window, just split the morning and afternoon."

### Abbreviations

- "same 30d window, by ticker"

### Common Misspellings

- "use the same date ragne"

### Noisy or Incomplete Input

- "same dates ticker split"

### Singular and Plural Forms

- Singular: "the same date range"; plural: "the same accepted date ranges"
  only when the prior contract explicitly contains multiple intervals.

### Full Questions

- "Can you use the same period and show the results by weekday?"

### Commands

- "Keep that exact period and exclude short trades."

### Sentence Fragments

- "same period, more detail"

### Follow-Up Wording

- "Break that period down by session" retains `active_date_range` only when
  `that period` uniquely identifies the accepted temporal contract.

### Correction Wording

- "No, the dates were right; I meant to change the metric."

### Comparison Wording

- "Within that same period, compare long and short trades."

### Ranking Wording

- "For the same dates, rank tickers by the accepted metric."

### Negated Wording

- "Don't change the date range; only change the filters."

### Exclusion Wording

- "Keep the same period but exclude the opening hour."

### Multi-Filter Wording

- "Same dates, only long trades under $5 outside premarket."

### Multi-Part Question Wording

- "Use the same period, group by weekday, and show the accepted result in a table."

### Ambiguous Wording

- "Use that time" is ambiguous when `that` could mean a period, session,
  execution time, hold duration, or more than one accepted result.

### Negative Examples

These examples must not map to `active_date_range`.

- "What about last month?" maps to `time_modification`.
- "How long did I hold trades?" requests a duration metric, not date-range state.

### Context Requirements

Require one uniquely referenced accepted temporal state with exact Category 13
resolution, authorized account binding, current event/timezone/as-of/endpoint
contract, and accepted revision provenance. Never use transcript prose,
browser/device/server-local clocks, or stale context as the range.

### Required Data

- Accepted-state revision; original temporal expression; resolved local/UTC
  bounds or record count; event basis; timezone; trusted `as_of`; inclusivity;
  calendar/window type; account binding; and coverage.

### Optional Data

- Privacy-safe accepted result/snapshot reference and trusted current-page date
  context may disambiguate a referent after server validation.

### Valid Filters

- Retain only accepted filters whose event/time semantics remain compatible
  with the active date range.

### Valid Groupings

- Retain any accepted grouping compatible with the range, event basis,
  timezone, grain, and eligible population.

### Valid Operators

- Context operation: retain the accepted temporal contract. Replacing,
  narrowing, or resetting it belongs to `time_modification`.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `inspect_data_quality`, and `assist_daily_review` when
  the accepted intent supports the same temporal contract.

### Incompatible Combinations

- Unknown event basis/timezone/as-of/endpoints, browser/device clock fallback,
  stale or cross-account range, incompatible session/calendar, reversed bounds,
  hidden period intersection, or an explicit contradictory new time phrase.

### Default Interpretation

Retain the exact accepted period only when a unique follow-up explicitly changes
another compatible field. No default period, year, event, timezone, session,
endpoint, `as_of`, or nearest/stale prior range exists.

### Clarification Conditions

Clarify when the prior period is not unique or lacks a required event, timezone,
trusted `as_of`, endpoint, calendar/session, or compatibility contract.

### Recommended Clarification Wording

- "Which accepted date range do you want to keep?"

### Unsupported Conditions

- Missing/invalid accepted range, unavailable event/timezone/calendar/session,
  stale `as_of`, unauthorized account, cross-account context, or unsupported
  temporal capability.

### Target Analytics Tool or Query Capability

- Future context resolver followed by Category 13 temporal and structured-query
  validation; only the accepted intent's approved deterministic tool may execute.

### Result Units

- Resolved local/UTC bounds or ordered-record count, event basis, IANA timezone,
  trusted `as_of`, inclusivity/endpoints, accepted revision, and coverage.

### Fee Handling

- Date-range retention never changes fee treatment; accepted money metrics keep
  exact gross/net, fee/credit, currency, allocation, and coverage contracts.

### Open-Trade Handling

- Retain only when the selected event and owning intent/metric cover open facts;
  missing endpoints and `needs_decision` records remain explicit coverage.

### Sample-Size Considerations

- The range itself has no adequacy threshold. Any retained result keeps exact
  eligible counts/population/coverage and owning metric/policy limitations.

## `active_filters` Language Registry

### Exact Definition

The complete ordered typed Category 12 predicate tree in the latest accepted
query revision, including authorized fields, operators, operands, boolean
grouping/precedence, eligible population, account scope, and coverage.

### Formal Wording

- "Retain the accepted predicate set while changing only the metric."

### Normal Conversational Wording

- "Keep the same filters and show expectancy instead."

### Trader Slang

- "Same cut: longs under five, no premarket."

### Abbreviations

- "same fltrs, use NPnL"

### Common Misspellings

- "keep teh same fitlers"

### Noisy or Incomplete Input

- "same filters expectancy"

### Singular and Plural Forms

- Singular: "keep that filter"; plural: "keep those filters" or "the same
  filter set."

### Full Questions

- "Can you keep those filters and group the result by ticker?"

### Commands

- "Use the same filters for last month."

### Sentence Fragments

- "same filters, June"

### Follow-Up Wording

- "Use those again" retains `active_filters` only when `those` uniquely refers
  to the accepted predicate tree, not rows, groups, or trades.

### Correction Wording

- "No, keep the filters; replace only the date range."

### Comparison Wording

- "With the same filters, compare long and short trades."

### Ranking Wording

- "Keep those filters and rank tickers by net P&L."

### Negated Wording

- "Don't remove any filters; only change the grouping."

### Exclusion Wording

- "Keep the same accepted exclusions when you rerun it."

### Multi-Filter Wording

- "Use the same long, under-$5, non-premarket filter set."

### Multi-Part Question Wording

- "Keep those filters, use June, and show the accepted calculation."

### Ambiguous Wording

- "Keep those" is ambiguous when `those` could refer to filters, trades,
  metrics, tickers, or comparison sides.

### Negative Examples

These examples must not map to `active_filters`.

- "Only long trades" maps to `filter_modification`.
- "Group by long and short" changes grouping/comparison structure rather than
  retaining the filter tree.

### Context Requirements

Require one unique accepted predicate tree with exact field/operator/operand/
precedence semantics, accepted-state revision, server-authorized account and
population, current field availability, and coverage. Do not rebuild filters
from result prose, visible chips, stale UI, or raw/private values.

### Required Data

- Accepted-state revision; ordered typed predicate tree; locked dimensions and
  operators; operand types; boolean precedence; account/population binding;
  validation status; and coverage.

### Optional Data

- Privacy-safe accepted query digest and trusted typed page-filter context may
  confirm identity after server validation.

### Valid Filters

- Exactly the filters in the accepted typed predicate tree; no implicit new,
  removed, broadened, or contradicted predicate.

### Valid Groupings

- Any accepted grouping compatible with the retained filters, eligible
  population, grain, and coverage.

### Valid Operators

- Context operation: retain the full predicate tree and precedence. Add/remove/
  replace/reset operations belong to `filter_modification` and Category 12.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `inspect_data_quality`, and `assist_daily_review` when
  the accepted intent supports those exact predicates.

### Incompatible Combinations

- Conflicting predicates, unknown/unauthorized fields or operands, stale or
  cross-account state, raw private search values, hidden precedence changes,
  missing-data-as-false behavior, or explicit filter modification.

### Default Interpretation

Retain the exact predicate tree only when one unique accepted query is being
continued and another field changes. No default filter, precedence, inclusion,
exclusion, operand, or missing-data truth value exists.

### Clarification Conditions

Clarify when the referenced filter set is not unique, a predicate is no longer
valid/authorized, or retained filters conflict with the requested change.

### Recommended Clarification Wording

- "Which accepted filter set do you want to keep?"

### Unsupported Conditions

- Missing accepted predicate tree, unavailable/unauthorized field, invalid
  operand/operator, conflicting clauses, stale revision, cross-account context,
  or unsupported query/filter capability.

### Target Analytics Tool or Query Capability

- Future context resolver plus Category 12 predicate and structured-query
  validator; only the accepted intent's approved deterministic tool may execute.

### Result Units

- Ordered typed predicate tree with fields/operators/operands, boolean
  grouping/precedence, accepted-state revision, population, and coverage.

### Fee Handling

- Fee/money predicates retain exact sign, gross/net, charge-cost/credit,
  currency, completeness, and operand semantics; missing fees are not invented.

### Open-Trade Handling

- Retained predicates preserve owning lifecycle eligibility; absent open-trade
  fields remain partial/unavailable and `needs_decision` does not match by default.

### Sample-Size Considerations

- Filters may change eligible counts, but retention preserves the exact accepted
  population and coverage. Adequacy remains with the owning metric/policy.

## `active_comparison` Language Registry

### Exact Definition

The complete typed Category 14 comparison contract in the latest accepted query
revision: exact sides/baseline, metric/basis, compatible populations, units,
fee/currency/time/event rules, difference/equality/percentage semantics, sample
counts, coverage, and limitations.

### Formal Wording

- "Retain the accepted comparison sides and basis while changing presentation."

### Normal Conversational Wording

- "Keep the same comparison and show me the trades behind it."

### Trader Slang

- "Same long-vs-short matchup, just give me the receipts."

### Abbreviations

- "same L vs S comp, table"

### Common Misspellings

- "keep the same comparsion"

### Noisy or Incomplete Input

- "same compare more detail"

### Singular and Plural Forms

- Singular: "the same comparison"; plural: "the same accepted comparisons"
  only when the accepted contract explicitly contains multiple comparisons.

### Full Questions

- "Can you keep that comparison and explain the accepted difference?"

### Commands

- "Use the same sides and basis, then show the result in a table."

### Sentence Fragments

- "same comparison, more detail"

### Follow-Up Wording

- "Which side was better?" may reference `active_comparison` only when the sides,
  metric, basis, and accepted result are unique; analysis belongs to
  `comparison_continuation`.

### Correction Wording

- "No, keep the long-versus-short comparison; I only meant to change the period."

### Comparison Wording

- "Use that same comparison for June."

### Ranking Wording

- "Keep the accepted sides, then rank their ticker groups by the named metric"
  requires a separately validated Category 14 rank contract.

### Negated Wording

- "Don't change the comparison sides or basis."

### Exclusion Wording

- "Keep the same comparison but exclude trades with incomplete fee coverage."

### Multi-Filter Wording

- "Same comparison for long trades under $5 outside premarket."

### Multi-Part Question Wording

- "Keep that comparison, use June, and explain the accepted sample limitation."

### Ambiguous Wording

- "What caused that difference?" is ambiguous without one unique accepted
  comparison/result and does not itself authorize a causal conclusion.

### Negative Examples

These examples must not map to `active_comparison`.

- "Compare long and short trades" creates a new `compare_groups` request.
- "Use expectancy instead" maps to `metric_modification`, even if a comparison
  is active.

### Context Requirements

Require one unique accepted comparison and result revision with exact sides,
metric/basis, populations, time/event, fee/currency, denominator/equality,
counts, coverage, account authorization, and privacy-safe provenance. Prose,
stale results, raw IDs, or pending ambiguity cannot reconstruct it.

### Required Data

- Accepted-state/result revision; typed sides/baseline; metric/basis/units;
  population/partition; time/event; fee/currency; difference/percentage/equality
  rules; eligible counts; authorization; coverage; and limitations.

### Optional Data

- Privacy-safe bounded evidence references may support detail/explanation after
  current authorization revalidation.

### Valid Filters

- Retain only accepted filters applied compatibly and explicitly to the defined
  side populations.

### Valid Groupings

- Retain only accepted groupings whose grain and candidate populations remain
  compatible across the comparison.

### Valid Operators

- Context operation: retain the full accepted comparison contract. Any metric,
  side, baseline, sort, limit, or basis change requires its owning typed delta.

### Compatible Intents

- `compare_groups`, `explain_result`, `diagnose_performance`,
  `summarize_performance`, `calculate_metric`, `group_and_aggregate`,
  `rank_results`, `detect_pattern`, `identify_strengths`, `evaluate_rule`,
  `evaluate_label`, `analyze_trade`, `analyze_sequence`, `analyze_trend`,
  `run_counterfactual`, `generate_coaching`, `inspect_data_quality`, and
  `assist_daily_review` only when the accepted intent contract includes this
  comparison.

### Incompatible Combinations

- Incompatible sides/populations/units/bases, hidden metric or denominator,
  cross-account comparison, stale result, raw-ID side, absent baseline, invalid
  percentage denominator, causal/advisory use, or explicit contradictory change.

### Default Interpretation

Retain the complete accepted comparison only for one unique compatible
follow-up. No default side, baseline, metric, direction, basis, denominator,
percentage, population, period, sort, limit, cause, or sample threshold exists.

### Clarification Conditions

Clarify when the comparison/result is not unique or any side, baseline,
metric/basis, population, denominator, period, authorization, or coverage is
missing/incompatible.

### Recommended Clarification Wording

- "Which accepted comparison do you want to continue?"

### Unsupported Conditions

- Missing/invalid comparison contract, incompatible populations, unavailable
  metric/basis/data, zero/nonmeaningful requested percentage denominator,
  stale/cross-account state, or unsupported continuation/tool capability.

### Target Analytics Tool or Query Capability

- Future context resolver plus Category 14 comparison and structured-query/
  result validator; only an approved deterministic comparison tool may execute.

### Result Units

- Typed sides/baseline, metric/basis/units, population/time/fee/currency rules,
  exact eligible counts, difference/equality/percentage contract, accepted
  revision, coverage, and limitations.

### Fee Handling

- Preserve identical compatible exact gross/net, fee/credit, currency,
  allocation, and completeness contracts for both sides; never change basis.

### Open-Trade Handling

- Preserve identical lifecycle eligibility across sides. Closed-only metrics do
  not admit open positions, and `needs_decision` remains outside accepted facts.

### Sample-Size Considerations

- Retain/revalidate exact eligible side counts, populations, exclusions,
  coverage, and owning metric/policy limitations; never infer adequacy from prose.

## `active_grouping` Language Registry

### Exact Definition

The ordered authorized Category 11 grouping dimension(s), grain, bucket/
definition versions, missing/complement behavior, population, event/time basis,
and coverage from the latest accepted query revision.

### Formal Wording

- "Retain the accepted grouping dimensions while replacing the metric."

### Normal Conversational Wording

- "Keep the same breakdown and use net P&L instead."

### Trader Slang

- "Same ticker split, just show net."

### Abbreviations

- "same grp, NPnL"

### Common Misspellings

- "keep the same groupping"

### Noisy or Incomplete Input

- "same breakdown net instead"

### Singular and Plural Forms

- Singular: "the same grouping"; plural: "the same grouping dimensions" or
  "the same groups" only when referring to accepted typed buckets.

### Full Questions

- "Can you keep that weekday breakdown and use expectancy instead?"

### Commands

- "Retain the same grouping and exclude premarket."

### Sentence Fragments

- "same groups, June"

### Follow-Up Wording

- "Use those groups again" retains `active_grouping` only when `those` uniquely
  refers to the accepted typed grouping, not trades, filters, or comparison sides.

### Correction Wording

- "No, keep the ticker grouping; I meant to replace the metric."

### Comparison Wording

- "Within the same weekday groups, compare long and short trades."

### Ranking Wording

- "Rank the same ticker groups by the accepted net P&L metric and basis."

### Negated Wording

- "Don't change the grouping; only change the period."

### Exclusion Wording

- "Keep the same groups but exclude missing session values."

### Multi-Filter Wording

- "Same ticker grouping for long trades under $5 outside premarket."

### Multi-Part Question Wording

- "Keep the same groups, use June, and show the accepted result in a table."

### Ambiguous Wording

- "Keep those" is ambiguous when `those` could mean result rows, comparison
  sides, filters, selected tickers, or grouping buckets.

### Negative Examples

These examples must not map to `active_grouping`.

- "Now group it by ticker" maps to `grouping_modification`.
- "Only ticker AAPL" is a filter/selection request, not grouping retention.

### Context Requirements

Require one unique accepted grouping contract with exact authorized dimensions,
order, grain, bucket/definition versions, missing/complement behavior,
population, event/time basis, accepted revision, account scope, and coverage.
Do not reconstruct groups from a table, result prose, raw IDs, or stale UI.

### Required Data

- Accepted-state revision; canonical grouping tokens/order; grain/bucket/
  definition versions; missing/complement/population rules; event/time basis;
  account authorization; validation; and coverage.

### Optional Data

- Privacy-safe accepted result/query digest and trusted typed page-grouping
  context may confirm a unique reference after server validation.

### Valid Filters

- Retain any accepted filters compatible with the grouping dimensions, grain,
  population, and coverage.

### Valid Groupings

- Exactly the ordered accepted grouping dimension(s) and typed buckets; no
  inferred, appended, replaced, or raw-ID grouping.

### Valid Operators

- Context operation: retain the grouping. Add/replace/remove/refine/reset belongs
  to `grouping_modification`; ranking direction/limit remains Category 14-owned.

### Compatible Intents

- `group_and_aggregate`, `compare_groups`, `rank_results`,
  `summarize_performance`, `calculate_metric`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_sequence`, `analyze_trend`,
  `run_counterfactual`, `generate_coaching`, `inspect_data_quality`, and
  `assist_daily_review` when their accepted contract supports that grouping.

### Incompatible Combinations

- Unknown/unauthorized dimension, incompatible grain/population, stale or
  cross-account state, raw-ID bucket, hidden grouping accumulation, invalid
  missing/complement behavior, or explicit contradictory grouping change.

### Default Interpretation

Retain the exact accepted grouping only for one unique compatible follow-up.
No default dimension, grain, bucket, missing/other/complement rule, sort
direction, result limit, or selected-object grouping exists.

### Clarification Conditions

Clarify when the grouping target is not unique, a dimension/version/grain is
missing, or retained grouping conflicts with metric, filters, comparison,
time/event basis, population, authorization, or coverage.

### Recommended Clarification Wording

- "Which accepted grouping do you want to keep?"

### Unsupported Conditions

- Missing accepted grouping, unavailable/unauthorized dimension, incompatible
  grain/population, stale revision, cross-account context, missing definition
  version, or unsupported grouping/query capability.

### Target Analytics Tool or Query Capability

- Future context resolver plus Category 11 grouping and structured-query
  validator; only the accepted intent's approved deterministic grouping tool may
  execute after validation.

### Result Units

- Ordered grouping tokens, grain/bucket/definition metadata, population,
  missing/complement rules, event/time basis, accepted revision, and coverage;
  grouped values retain their metric units.

### Fee Handling

- Grouping retention never changes fee treatment. Grouped money metrics keep
  exact gross/net, fee/credit, currency, allocation, and coverage contracts.

### Open-Trade Handling

- Preserve owning dimension/metric lifecycle eligibility; closed,
  `legitimate_open`, missing, and `needs_decision` populations stay explicit.

### Sample-Size Considerations

- Retain exact eligible count per accepted group, exclusions, coverage, and
  owning metric/policy limitations; do not label small groups reliable from prose.

## `selected_trade` Language Registry

### Exact Definition

One trusted typed trade selection, bound to the accepted state revision and
same server-authorized user/workspace/Journal account, with privacy-safe opaque
handle, selection source, factual provenance revision, and coverage. Raw
internal/execution/source/broker/account IDs never enter model or visible output.

### Formal Wording

- "Use the trade selected in the trusted current-page context."

### Normal Conversational Wording

- "Analyze this trade."

### Trader Slang

- "Break down this play."

### Abbreviations

- "analyze sel trd" means the trusted selected trade; `sel trd` never rewrites
  or guesses a ticker symbol.

### Common Misspellings

- "anlyze this trad"

### Noisy or Incomplete Input

- "this one what went wrong"

### Singular and Plural Forms

- Singular only: "this trade" or "the selected trade"; plural wording requires
  a separate authorized retrieval/population and must not widen this selection.

### Full Questions

- "How does this selected trade compare with my similar accepted trades?"

### Commands

- "Show the entries and exits for the selected trade."

### Sentence Fragments

- "this trade"

### Follow-Up Wording

- "What about this one?" resolves only when `this one` uniquely identifies the
  trusted selected trade in accepted/UI context.

### Correction Wording

- "No, I mean the trade currently selected in TraderLink, not the prior result."

### Comparison Wording

- "Compare this selected trade with the approved similar-trade population."

### Ranking Wording

- "Was this selected trade among the worst by net P&L?" requires a separate
  validated Category 14 metric, basis, direction, finite limit, and tie contract.

### Negated Wording

- "Don't use the previous trade; use the one currently selected."

### Exclusion Wording

- "Find similar trades but exclude this selected trade from the peer set."

### Multi-Filter Wording

- "Compare this selected trade with same-ticker long trades under $5 in June."

### Multi-Part Question Wording

- "Analyze this trade, show its accepted facts, and explain the supported calculation."

### Ambiguous Wording

- "Analyze it" is ambiguous when `it` could refer to a trade, ticker, Journal
  entry, comparison, or more than one trusted candidate.

### Negative Examples

These examples must not map to `selected_trade`.

- "Analyze my last trade" is a temporal retrieval/selection request, not proof
  that a UI trade is selected.
- "Use trade ID 12345" cannot establish identity or authorization from a raw ID.

### Context Requirements

Require a trusted typed selection source, privacy-safe server-resolved handle,
entity type, accepted-state revision, factual provenance/snapshot revision,
current coverage, and same authorized account. Revalidate every turn; never use
prose proximity, stale UI, raw IDs, or cross-account state.

### Required Data

- Trusted selection source; typed trade binding; accepted/provenance revisions;
  server authorization; lifecycle status; capability status; and coverage.

### Optional Data

- Ticker/date and privacy-safe bounded evidence links may help confirm the
  selection after server validation without exposing raw provenance.

### Valid Filters

- Filters apply only to a separately validated peer/retrieval population; they
  cannot redefine the selected trade itself.

### Valid Groupings

- Groupings may organize separately authorized comparison evidence; selected
  trade identity remains one object and never becomes a group implicitly.

### Valid Operators

- Typed selection operations: retain or replace with another trusted selection
  after validation; an opaque handle alone is never an authorization operator.

### Compatible Intents

- `analyze_trade`, `find_similar_trades`, `retrieve_records`,
  `calculate_metric`, `compare_groups`, `explain_result`,
  `diagnose_performance`, `inspect_data_quality`, `assist_journaling`, and
  `assist_daily_review` when their locked contract supports selected-trade scope.

### Incompatible Combinations

- Raw/internal/source ID lookup, cross-account selection, stale or wrong-typed
  context, inferred nearby trade, missing authorization/provenance, protected
  write without its draft/confirmation contract, cause/advice, or hidden sort,
  limit, similarity, metric, or basis.

### Default Interpretation

Use the selected trade only when trusted typed context supplies one unique
authorized current candidate. There is no default last/visible/recent trade,
raw-ID lookup, similarity population, metric, basis, sort, or result limit.

### Clarification Conditions

Clarify when no trusted selected trade exists, multiple compatible trade
candidates exist, or the selection is stale, unauthorized, or wrong-typed.

### Recommended Clarification Wording

- "Do you mean the trade currently selected in TraderLink?"

### Unsupported Conditions

- Missing/invalid trusted selection, unauthorized/cross-account/stale object,
  unavailable factual provenance, raw-ID-only request, or unsupported selected-
  trade capability returns focused clarification or unsupported state.

### Target Analytics Tool or Query Capability

- Future selected-context resolver and structured-query validator followed only
  by an approved read-only selected-trade tool; no runtime or mutation is authorized.

### Result Units

- Privacy-safe typed selection binding, accepted/provenance revisions,
  lifecycle/account scope, capability, and coverage; no raw ID or analytical unit.

### Fee Handling

- Selection never chooses fee basis. Any analysis preserves exact gross/net,
  charge-cost/credit, currency, allocation, completeness, and coverage contracts.

### Open-Trade Handling

- A confirmed `legitimate_open` trade may be selected, but selection never makes
  closed-only metrics eligible, infers position intent, or admits `needs_decision`.

### Sample-Size Considerations

- One selected trade has no reliability threshold. Peer/comparison requests must
  report exact eligible peer counts/population/coverage under the owning policy.

## `selected_ticker` Language Registry

### Exact Definition

One explicit or trusted typed normalized ticker selection bound to the accepted
state revision, factual provenance/coverage, and same server-authorized account.
The ticker symbol remains exact; raw security/broker/source IDs are excluded.

### Formal Wording

- "Use the ticker selected in trusted page context."

### Normal Conversational Wording

- "How did I do on this ticker?"

### Trader Slang

- "Show my history on this name."

### Abbreviations

- "sel tkr" means the trusted selected-ticker field only; an actual ticker such
  as `AAPL` remains exact and is never expanded, corrected, or guessed.

### Common Misspellings

- "use the seleced tickr"

### Noisy or Incomplete Input

- "this ticker june stats"

### Singular and Plural Forms

- Singular: "this ticker" or "the selected ticker"; plural tickers require an
  explicit authorized set/filter and cannot widen this one-object state.

### Full Questions

- "What was my net P&L on the ticker selected here during June?"

### Commands

- "Show my accepted trades for the selected ticker."

### Sentence Fragments

- "this ticker"

### Follow-Up Wording

- "What about this name?" resolves only when one trusted selected ticker is the
  unique compatible referent.

### Correction Wording

- "No, use the ticker currently selected, not the ticker from the prior answer."

### Comparison Wording

- "Compare this selected ticker with the exact authorized all-other-tickers cohort."

### Ranking Wording

- "Where did this ticker rank by net P&L?" requires separate Category 14 metric,
  basis, eligible universe, direction, finite limit, and tie validation.

### Negated Wording

- "Don't use the prior ticker; use the selected one."

### Exclusion Wording

- "Show all other authorized tickers except this selected ticker."

### Multi-Filter Wording

- "For this ticker, show long trades under $5 outside premarket in June."

### Multi-Part Question Wording

- "Show this ticker's June results and compare them with its accepted earlier period."

### Ambiguous Wording

- "How did I trade it?" is ambiguous when `it` could be a ticker, selected
  trade, setup, or more than one trusted ticker candidate.

### Negative Examples

These examples must not map to `selected_ticker`.

- "Which ticker was most profitable?" is a `rank_results` request with no
  selected ticker.
- "Use security ID 987" cannot establish ticker identity/authorization from a raw ID.

### Context Requirements

Require one explicit or trusted typed ticker, exact normalized symbol, selection
source, accepted/provenance revisions, same authorized account, field
availability, and coverage. Never infer from a nearby/stale trade, prose, browser
visibility, another account, or a similar-looking ticker.

### Required Data

- Exact normalized ticker; trusted selection source; accepted/provenance
  revisions; authorization/account binding; capability; and coverage.

### Optional Data

- Privacy-safe current-page type and accepted query/result digest may confirm
  reference compatibility without exposing raw security identifiers.

### Valid Filters

- A validated ticker equality/membership filter may use the exact selected
  symbol in the same authorized scope; other filters remain Category 12-owned.

### Valid Groupings

- Ticker grouping may include the selected ticker in an authorized population,
  but grouping cannot replace or infer selection.

### Valid Operators

- Typed selection retain/replace after validation; equality/membership operators
  belong to Category 12 and never accept raw security IDs here.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `analyze_trade`, `find_similar_trades`, `analyze_sequence`, `analyze_trend`,
  `inspect_data_quality`, and `assist_daily_review` when selected-ticker scope is valid.

### Incompatible Combinations

- Cross-account or stale ticker, raw security/broker/source ID, guessed symbol,
  silent symbol correction, unauthorized universe, hidden all-other complement,
  inferred metric/basis/sort/limit, cause/advice, or protected write.

### Default Interpretation

Use only one exact explicit/trusted selected ticker. There is no default from
the last visible trade, prior prose, popular symbol, partial spelling, raw ID,
comparison universe, metric, basis, sort, or limit.

### Clarification Conditions

Clarify when no trusted ticker exists, multiple ticker candidates are possible,
or the symbol/scope is stale, invalid, unavailable, or unauthorized.

### Recommended Clarification Wording

- "Which ticker do you mean?"

### Unsupported Conditions

- Missing/invalid symbol, unauthorized/cross-account/stale selection, raw-ID-
  only request, unavailable ticker coverage, or unsupported ticker capability.

### Target Analytics Tool or Query Capability

- Future selected-context resolver and structured-query validator followed only
  by an approved account-scoped ticker read/analytics tool; no runtime is authorized.

### Result Units

- Exact normalized ticker, trusted source, accepted/provenance revisions,
  account binding, capability, and coverage; no raw security ID.

### Fee Handling

- Ticker selection never changes fee basis. Money analytics retain exact
  gross/net, fee/credit, currency, allocation, completeness, and coverage.

### Open-Trade Handling

- A selected ticker may have closed and/or `legitimate_open` facts; each query
  preserves lifecycle eligibility and keeps `needs_decision` coverage explicit.

### Sample-Size Considerations

- Selection itself has no threshold. Ticker analytics report exact eligible
  counts/population/coverage and owning metric/policy limitations.

## `selected_journal_entry` Language Registry

### Exact Definition

One trusted typed authorized Journal-entry binding in the accepted state,
containing only privacy-safe handle/type/permitted date metadata, selection
source, provenance revision, same-account scope, and coverage—not copied private
text or raw internal/source/broker/account identifiers.

### Formal Wording

- "Use the Journal entry selected in trusted current-page context."

### Normal Conversational Wording

- "Explain this journal entry."

### Trader Slang

- "Pull up this note and help me review it."

### Abbreviations

- "sel jrnl entry" means the trusted typed selection; it never accepts an
  internal entry ID as user-facing shorthand.

### Common Misspellings

- "use this jounral enty"

### Noisy or Incomplete Input

- "this note what did i mean"

### Singular and Plural Forms

- Singular: "this Journal entry"; plural entries require an explicit authorized
  retrieval set and cannot widen this selected-object state.

### Full Questions

- "What accepted facts are connected to the Journal entry selected here?"

### Commands

- "Summarize the selected Journal entry without changing it."

### Sentence Fragments

- "this journal entry"

### Follow-Up Wording

- "What about this note?" resolves only when one trusted typed Journal entry is
  the unique compatible referent.

### Correction Wording

- "No, I mean the selected Journal entry, not the earlier review."

### Comparison Wording

- "Compare the accepted period referenced by this entry with the prior period"
  requires a separately validated comparison; the entry does not define sides.

### Ranking Wording

- "Was the trade linked to this entry among my worst?" requires separately
  authorized linkage plus Category 14 metric/basis/rank validation.

### Negated Wording

- "Don't edit this entry; only explain the accepted content."

### Exclusion Wording

- "Show related accepted trades excluding any without verified linkage to this entry."

### Multi-Filter Wording

- "For this selected entry, show linked June trades under $5 outside premarket."

### Multi-Part Question Wording

- "Summarize this entry and show its privacy-safe supporting accepted facts."

### Ambiguous Wording

- "Explain this" is ambiguous when `this` could be a note, trade, saved review,
  rule result, comparison, or more than one selected Journal object.

### Negative Examples

These examples must not map to `selected_journal_entry`.

- "Write a new journal note" maps to `assist_journaling` draft handling, not selection.
- "Open entry ID abc123" cannot establish identity/authorization from a raw ID.

### Context Requirements

Require one trusted typed entry selection, privacy-safe server-resolved handle,
entry type, selection source, accepted/provenance revisions, same authorized
account, current coverage, and minimum approved content package. Do not use
transcript prose, stale UI, copied private text, or raw/cross-account identifiers.

### Required Data

- Typed entry binding/type; trusted source; accepted/provenance revisions;
  authorization/account binding; content-availability boundary; capability; and coverage.

### Optional Data

- Permitted date/type metadata and privacy-safe bounded links to owning accepted
  facts may support explanation after authorization revalidation.

### Valid Filters

- Filters apply only to separately authorized linked-fact retrieval; they cannot
  redefine or infer the selected Journal entry.

### Valid Groupings

- Grouping linked facts is allowed only under their owning typed contract; the
  selected entry itself is not an inferred grouping dimension.

### Valid Operators

- Typed selection retain/replace after validation; search/equality operators
  cannot use raw private entry text or internal IDs through this state.

### Compatible Intents

- `retrieve_records`, `explain_result`, `assist_journaling`,
  `assist_daily_review`, `inspect_data_quality`, `product_help`, and
  `analyze_trade` only when the locked intent has authorized typed linkage to
  the selected entry.

### Incompatible Combinations

- Raw-ID/private-text lookup, cross-account or stale entry, unauthorized content,
  inferred trade/ticker linkage, silent note/tag/review mutation, protected
  action without draft/confirmation, cause/advice, or hidden metric/basis/sort/limit.

### Default Interpretation

Use only one trusted typed current selection. There is no default latest/visible
note, inferred linked trade/ticker, raw-ID lookup, permission to read private
content, edit action, metric, basis, sort, or result limit.

### Clarification Conditions

Clarify when no trusted selected entry exists, multiple typed candidates exist,
or entry type, authorization, provenance, linkage, or content coverage is unresolved.

### Recommended Clarification Wording

- "Do you mean the Journal entry currently selected in TraderLink?"

### Unsupported Conditions

- Missing/invalid trusted selection, unauthorized/cross-account/stale entry,
  unavailable content/linkage, raw-ID/private-text request, or unsupported tool.

### Target Analytics Tool or Query Capability

- Future selected-context resolver and structured-query validator followed by an
  approved read-only Journal-entry/fact tool; no save, edit, or runtime is authorized.

### Result Units

- Privacy-safe typed entry binding/type, accepted/provenance revisions,
  account/content scope, capability, and coverage; no raw ID or copied private text.

### Fee Handling

- Entry selection cannot alter financial truth. Linked analysis retains exact
  gross/net, fee/credit, currency, allocation, and coverage contracts.

### Open-Trade Handling

- Entry selection is lifecycle-neutral; linked open/decision facts retain their
  owning status and never become completed-trade proof through note prose.

### Sample-Size Considerations

- One entry has no sample threshold. Any linked analytical claim retains exact
  eligible counts/population/coverage and owning limitations.

## `current_account` Language Registry

### Exact Definition

The server-owned immutable authorization binding for one Platform user,
workspace, and selected Journal account that scopes the entire conversation and
both accepted-query/pending-ambiguity tracks. User language, client values,
object/conversation handles, and model output cannot create, move, or broaden it.

### Formal Wording

- "Continue within the Journal account already authorized for this conversation."

### Normal Conversational Wording

- "Use the account this conversation is already on."

### Trader Slang

- "Keep it on this journal account."

### Abbreviations

- "curr acct" may refer only to the server-bound current account; it is never an
  invitation to type an account number or broker identifier.

### Common Misspellings

- "use the curent acount"

### Noisy or Incomplete Input

- "same account keep going"

### Singular and Plural Forms

- Singular only: one current Journal account per conversation. Plural accounts
  require separate authorized scopes/conversations and cannot be combined here.

### Full Questions

- "Can you continue using the Journal account already selected for this conversation?"

### Commands

- "Keep this conversation in its current authorized account."

### Sentence Fragments

- "same current account"

### Follow-Up Wording

- "Keep going here" retains account scope only because the server already binds
  the conversation; `here` cannot select another account.

### Correction Wording

- "No, do not move this conversation; keep its existing account scope."

### Comparison Wording

- "Compare within this account only" never permits a cross-account comparison.

### Ranking Wording

- "Rank results within the current account" keeps Category 14 metric/basis/
  universe/sort/limit contracts account-isolated.

### Negated Wording

- "Do not include any other account."

### Exclusion Wording

- "Exclude all data outside this conversation's authorized account scope."

### Multi-Filter Wording

- "In this account, show June long trades under $5 outside premarket."

### Multi-Part Question Wording

- "Keep this account scope, summarize June, and show the accepted result in a table."

### Ambiguous Wording

- "Use my other account" cannot be resolved from prose and must not solicit or
  accept an account number; the normal account selector/new conversation owns it.

### Negative Examples

These examples must not map to `current_account`.

- "My broker account number is..." is private raw identity and must not set scope.
- "Combine all my accounts" is an unsupported cross-account expansion request.

### Context Requirements

Require server-verified Platform identity, workspace access, selected Journal
account, authorization revision, conversation binding, and revalidation on every
turn. Never use user/device/browser claims, raw IDs, credentials, prose, or stale
session state as authority.

### Required Data

- Server-authenticated user/workspace/account binding; permission/selection
  revision; conversation binding; entitlement/capability status; and privacy-safe audit status.

### Optional Data

- Privacy-safe account display label may be rendered by the normal UI outside
  model context; it never replaces server authorization.

### Valid Filters

- All query filters operate only inside the immutable account boundary; account
  scope itself is not a user-controlled filter.

### Valid Groupings

- Grouping cannot cross or group by hidden account identities through this
  contract; every group remains inside the one account scope.

### Valid Operators

- Server operation: verify/retain scope. No natural-language operator can switch,
  union, broaden, compare, or override account authorization.

### Compatible Intents

- Every exact locked Category 1 intent is account-scoped: `retrieve_records`,
  `summarize_performance`, `calculate_metric`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `detect_pattern`, `explain_result`,
  `diagnose_performance`, `identify_strengths`, `evaluate_rule`,
  `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `explain_concept`, `inspect_data_quality`,
  `assist_journaling`, `product_help`, `unsupported_request`,
  `prepare_manual_execution_draft`, `prepare_user_setting_change`, and
  `assist_daily_review`.

### Incompatible Combinations

- Cross-account join/union/comparison, user-entered account/raw identity,
  client-only scope, conversation transfer, prompt injection, stale permission,
  credential request, hidden admin scope, or model-selected account.

### Default Interpretation

The only valid scope is the server-bound account already attached to the
conversation. There is no language/default fallback to another, last-used,
visible, browser, broker, or all-accounts scope.

### Clarification Conditions

Do not ask the user for an account number, raw ID, email, credential, or broker
identifier. If the server binding is absent/invalid, stop. If the user wants a
different account, require the normal account selector and a new account-scoped
conversation flow.

### Recommended Clarification Wording

- "Should I continue in the Journal account already selected for this conversation?"

### Unsupported Conditions

- Missing/expired authorization, account mismatch, cross-account request,
  user-supplied raw identity, absent workspace access, prompt injection, or
  unavailable account-scoped capability.

### Target Analytics Tool or Query Capability

- Server authorization/scope validator before any future context resolver or
  deterministic tool. Language/model code never chooses scope; no runtime is authorized here.

### Result Units

- Server-internal privacy-safe scope/authorization revision and status; no raw
  subject, workspace, account, broker, credential, or permission ID in output.

### Fee Handling

- Account scope never changes fee treatment. Each query preserves its exact
  account-scoped fee/credit, currency, allocation, completeness, and coverage.

### Open-Trade Handling

- Scope contains but does not merge lifecycle populations; `ready_closed`,
  `legitimate_open`, and `needs_decision` remain distinct.

### Sample-Size Considerations

- Account scope has no adequacy threshold. Every analytical result reports its
  exact eligible population/counts/coverage under owning policy.

## `response_detail_level` Language Registry

### Exact Definition

The accepted locked Category 18 response mode—`brief`, `standard`, `detailed`,
`table`, `coach`, or `audit`—retained for the latest accepted query revision. It
changes presentation/evidence depth only and never query truth or authorization.

### Formal Wording

- "Retain the accepted response mode while changing the analysis period."

### Normal Conversational Wording

- "Answer it the same way, but for June."

### Trader Slang

- "Same quick read, just last month."

### Abbreviations

- "same resp mode" refers only to a locked Category 18 mode; it does not mean
  result limit, metric basis, or ticker shorthand.

### Common Misspellings

- "keep the same responce detial"

### Noisy or Incomplete Input

- "same answer style june"

### Singular and Plural Forms

- Singular: "the same response mode"; plural modes require an explicit new
  presentation request and cannot coexist silently.

### Full Questions

- "Can you keep the standard response mode and use last month instead?"

### Commands

- "Keep the same detail level and change only the ticker."

### Sentence Fragments

- "same detail, June"

### Follow-Up Wording

- "Same format" retains the mode only when one accepted response/result is the
  unique compatible referent.

### Correction Wording

- "No, keep the table format; I meant to change the period."

### Comparison Wording

- "Use the same response detail for the accepted comparison."

### Ranking Wording

- "Show the accepted ranking in the same table mode" retains Category 14 sort/
  finite limit/ties and changes no rank semantics.

### Negated Wording

- "Don't change the answer detail; only change the filters."

### Exclusion Wording

- "Keep it brief but do not omit any material limitation."

### Multi-Filter Wording

- "Use the same response mode for June long trades under $5 outside premarket."

### Multi-Part Question Wording

- "Keep the standard mode, use June, and show the accepted evidence links."

### Ambiguous Wording

- "Do it the same way" is ambiguous when `same` could mean query fields,
  calculation basis, comparison, grouping, sort/limit, or presentation mode.

### Negative Examples

These examples must not map to `response_detail_level`.

- "Show percentages" may be `metric_modification`, not response detail.
- "Show only the top five" changes Category 14 result limit, not response mode.

### Context Requirements

Require one accepted query/response revision, one exact locked Category 18 mode,
unique compatible reference, current account authorization, immutable factual
result/snapshot, and coverage/limitations. Never infer mode from response length,
device, browser, prose style, stale answer, or raw ID.

### Required Data

- Accepted-state/response revision; exact Category 18 mode; unchanged query/
  result digest; account authorization; evidence/coverage constraints; and capability status.

### Optional Data

- Trusted UI presentation control may explicitly select a mode after server
  validation; it cannot change query truth.

### Valid Filters

- Any accepted filters remain unchanged; presentation mode neither adds nor
  removes predicates.

### Valid Groupings

- Any accepted grouping remains unchanged. `table` may render only grouping
  already validated by the query/result.

### Valid Operators

- Context operation: retain the exact mode. Mode replacement belongs to
  `detail_modification`; sort direction and result limit remain Category 14-owned.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `explain_concept`, `inspect_data_quality`,
  `assist_journaling`, `product_help`, and `assist_daily_review` under each
  intent's locked evidence/safety boundary.

### Incompatible Combinations

- Presentation that changes values/population/formula/basis, hides material
  limitations, fabricates table rows/evidence, exposes raw IDs, crosses accounts,
  uses stale results, infers cause/advice, or treats detail as sort/limit change.

### Default Interpretation

Retain an exact accepted mode only for one unique compatible continuation. Any
default is owned solely by locked Category 18; Category 15 never infers mode,
metric basis, sort direction, result limit, evidence permission, or coaching advice.

### Clarification Conditions

Clarify when the referenced response is not unique, no accepted mode exists, or
the requested presentation conflicts with evidence, privacy, capability, or result shape.

### Recommended Clarification Wording

- "Which response mode do you want: brief, standard, detailed, table, coach, or audit?"

### Unsupported Conditions

- Missing accepted result/mode, stale or cross-account response, unavailable
  evidence shape, raw-ID request, policy conflict, or unsupported presentation capability.

### Target Analytics Tool or Query Capability

- Future context resolver plus Category 18 response-contract validator and
  presentation layer over an accepted deterministic result; no analytics or runtime is added.

### Result Units

- Exact Category 18 mode, accepted response/query revision, unchanged result
  digest, evidence constraints, and coverage; analytical units remain unchanged.

### Fee Handling

- Mode cannot alter or hide material gross/net, fee/credit, currency,
  allocation, completeness, or coverage facts.

### Open-Trade Handling

- Mode cannot change lifecycle eligibility; any open facts must already be
  authorized/supported and remain clearly distinguished.

### Sample-Size Considerations

- Mode cannot change sample interpretation. Exact counts/population/coverage
  and material limitations remain visible even in `brief` or `table` mode.

## `unresolved_ambiguity` Language Registry

### Exact Definition

A separate typed privacy-safe pending record created only by a validator-
accepted `clarification_needed` outcome and tied to an unchanged accepted-query
revision. A complete accepted clarification clears it and creates the next
complete accepted query revision; a still-ambiguous accepted
`clarification_needed` outcome replaces only the marker; rejected, unsafe,
unsupported, or unvalidated answers update neither track.

### Formal Wording

- "The accepted query remains unchanged while one unresolved field is clarified."

### Normal Conversational Wording

- "I need one detail before I can continue that request."

### Trader Slang

- "Which one do you mean before I rerun it?"

### Abbreviations

- "clarify 1 field" denotes one privacy-safe pending field; it is not a query
  value, raw identifier, confirmation, or execution command.

### Common Misspellings

- "which one did you meen"

### Noisy or Incomplete Input

- "that one" after a focused two-candidate clarification remains pending if it
  still does not uniquely identify a trusted candidate.

### Singular and Plural Forms

- Singular pending marker and one highest-impact unresolved field per focused
  turn; multiple unresolved fields are staged sequentially, never one compound prompt.

### Full Questions

- "Do you mean the selected trade or the accepted same-ticker comparison?"

### Commands

- "Clarify only the unresolved metric before changing the accepted query."

### Sentence Fragments

- "which period?"

### Follow-Up Wording

- "The first one" resolves the marker only if it uniquely maps to one listed
  privacy-safe allowed choice and passes authorization/validation.

### Correction Wording

- "No, by later trades I meant trades after 11:00" proposes a typed correction;
  the accepted query changes only after complete validation.

### Comparison Wording

- "Are you comparing this selected trade with similar trades, or recent
  performance with an earlier period?" asks one comparison-target field.

### Ranking Wording

- "Which metric should define best?" clarifies the highest-impact rank metric;
  basis, direction, finite limit, and ties are staged later if still unresolved.

### Negated Wording

- "Not the selected trade—the accepted ticker comparison" may resolve one
  pending referent only after typed validation.

### Exclusion Wording

- "Anything except the selected trade" is not enough if multiple authorized
  candidates remain and therefore replaces only the pending marker.

### Multi-Filter Wording

- "Did you mean under $5 and long, or under $5 and short?" clarifies one
  conflicting direction field while retaining the accepted filter revision.

### Multi-Part Question Wording

- Clarify only the highest-impact field now; any later metric basis, period,
  grouping, sort, limit, or selection question remains separately staged.

### Ambiguous Wording

- "That one", "same as before", "better", "recent", and "use net" remain
  unresolved when multiple compatible typed meanings materially change the query.

### Negative Examples

These examples must not map to `unresolved_ambiguity`.

- A malformed/unsafe/rejected answer creates or updates no pending marker.
- A complete validator-accepted answer is not pending ambiguity; it clears the
  marker and creates the next accepted revision.

### Context Requirements

Require the unchanged accepted-state revision, validator-accepted
`clarification_needed` status, one typed unresolved field, privacy-safe candidate
kinds/allowed choices, focused question, opaque/digested originating reference,
pending revision, account authorization, and no raw/private values.

### Required Data

- Accepted-state revision; pending-marker revision/status; unresolved-field
  token; allowed candidate kinds/choices; focused question; originating opaque/
  digested reference; validator outcome; and account binding.

### Optional Data

- Trusted typed UI context may eliminate candidates after authorization and
  compatibility validation; it never broadens scope or supplies a raw ID.

### Valid Filters

- The marker may name one unresolved filter field/operator/operand kind, but it
  cannot add, remove, replace, or evaluate a predicate.

### Valid Groupings

- The marker may name one unresolved grouping field/grain choice, but it cannot
  choose, create, or change grouping state.

### Valid Operators

- Pending-track operations: create or replace marker after accepted
  `clarification_needed`; clear marker plus create accepted revision after a
  complete accepted clarification; no partial accepted-field mutation.

### Compatible Intents

- Any exact locked Category 1 intent may have a pending ambiguity:
  `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `explain_concept`, `inspect_data_quality`,
  `assist_journaling`, `product_help`, `unsupported_request`,
  `prepare_manual_execution_draft`, `prepare_user_setting_change`, and
  `assist_daily_review`.

### Incompatible Combinations

- Pending marker used as a query value, partial accepted-state mutation, raw/
  private candidate value, cross-account candidate, compound unrelated question,
  unvalidated/rejected/unsafe update, hidden default, tool execution, confirmation,
  cause/advice, or stale answer accepted as resolution.

### Default Interpretation

None. The marker stores no chosen meaning and cannot default a referent, metric,
basis, period, filter, grouping, comparison, selection, response mode, sort,
limit, account, cause, or action.

### Clarification Conditions

Create/replace the marker only when a critical field remains materially
ambiguous after trusted accepted/UI context. Ask the highest-impact field first;
after a complete accepted answer, stage any remaining field as a new separate marker.

### Recommended Clarification Wording

- "Which meaning did you intend for the unresolved field?"

### Unsupported Conditions

- Missing accepted revision, unauthorized/cross-account candidates, raw/private
  required choices, stale/mismatched marker, unsafe/unsupported answer, invalid
  validator outcome, or unavailable clarification capability.

### Target Analytics Tool or Query Capability

- Future context resolver and structured-query validator pending-track contract;
  no analytics tool executes while a critical ambiguity remains and no runtime is authorized.

### Result Units

- Typed unresolved-field token, privacy-safe allowed choice kinds, one focused
  question, opaque/digested origin, unchanged accepted revision, pending revision/status.

### Fee Handling

- A fee/basis ambiguity marker may list only privacy-safe typed choices; it
  cannot select gross/net, invent fees/credits, infer completeness, or combine currencies.

### Open-Trade Handling

- A lifecycle ambiguity marker cannot classify a position, admit
  `needs_decision` facts, or change open/closed eligibility.

### Sample-Size Considerations

- The marker has no sample threshold. If sample adequacy is unresolved, retain
  exact accepted counts/population/coverage and ask only the owning threshold/
  interpretation field; never infer adequacy.

## `filter_modification` Language Registry

### Exact Definition

An explicit Category 12-owned add/remove/replace/retain/reset predicate delta
against one uniquely referenced accepted query revision. A correction replaces
its contradicted predicate; the full query validates before atomic acceptance.

### Formal Wording

- "Retain the accepted query and add a long-direction filter."

### Normal Conversational Wording

- "Only long trades."

### Trader Slang

- "Cut out premarket and keep the rest."

### Abbreviations

- "excl PM" means propose exclusion of premarket only after Category 12 validates it.

### Common Misspellings

- "remvoe premarket"

### Noisy or Incomplete Input

- "same but no aapl"

### Singular and Plural Forms

- "that filter" targets one accepted predicate; "those filters" requires a
  unique accepted predicate set.

### Full Questions

- "Can you keep the accepted analysis but show only long trades?"

### Commands

- "Exclude AAPL from the accepted query."

### Sentence Fragments

- "just trades under $3"

### Follow-Up Wording

- "Remove that" modifies a filter only when `that` uniquely resolves to one accepted predicate.

### Correction Wording

- "No, replace under $5 with under $3; don't keep both."

### Comparison Wording

- "Keep the comparison and add the same validated long filter to both sides."

### Ranking Wording

- "Keep the rank metric/sort/limit and exclude premarket from its eligible population."

### Negated Wording

- "Not short trades" requires typed exclusion/negation validation, not a guessed opposite.

### Exclusion Wording

- "Exclude AAPL."

### Multi-Filter Wording

- "Only long trades under $5 outside premarket."

### Multi-Part Question Wording

- "Exclude AAPL, use June, and keep the accepted metric."

### Ambiguous Wording

- "Remove that" is ambiguous when `that` could be a filter, group, metric, trade, or result row.

### Negative Examples

These examples must not map to `filter_modification`.

- "Keep the same filters" maps to `active_filters` retention.
- "Group long and short separately" maps to `grouping_modification` or comparison composition.

### Context Requirements

Require one accepted query/predicate revision, unique compatible reference,
authorized account/population, exact field/operator/operand/precedence, and current coverage.

### Required Data

- Source accepted revision; typed current predicate tree; explicit delta/target;
  authorization; validation status; affected population; and coverage.

### Optional Data

- Trusted typed UI filter context may disambiguate after server validation; prose chips/raw IDs do not.

### Valid Filters

- Category 12-valid fields/operators/typed operands in the same authorized scope.

### Valid Groupings

- Retained groupings must remain compatible with the changed eligible population/grain.

### Valid Operators

- Add, remove, replace/correct, retain, or reset an exact predicate; never hidden accumulation.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`,
  `inspect_data_quality`, and `assist_daily_review` when filterable.

### Incompatible Combinations

- Unknown/unauthorized field, invalid operand, conflicting predicate, hidden precedence,
  stale/cross-account target, raw private value, or filter delta that invalidates unreset fields.

### Default Interpretation

No default target/operation/field/operator/operand/precedence exists. Carry prior
state only when one accepted modification target is unique.

### Clarification Conditions

Clarify the highest-impact filter target first when the predicate/delta target is not unique or valid.

### Recommended Clarification Wording

- "Which accepted filter do you want to change?"

### Unsupported Conditions

- Missing accepted query, stale/unauthorized predicate, invalid field/operator/
  operand, unresolved conflict, cross-account scope, or unavailable filter capability.

### Target Analytics Tool or Query Capability

- Future context resolver plus Category 12 predicate/full-query validator; no tool executes before acceptance.

### Result Units

- Typed predicate delta, exact target, retained tree/precedence, source/next revision, population, and coverage.

### Fee Handling

- Fee filters retain exact sign, gross/net, cost/credit, currency, completeness, and typed operand contracts.

### Open-Trade Handling

- Preserve owning lifecycle eligibility; missing open fields remain unavailable and `needs_decision` never defaults false/true.

### Sample-Size Considerations

- Recompute/report exact eligible count/population/coverage after acceptance; adequacy remains owner-defined.

## `time_modification` Language Registry

### Exact Definition

An explicit Category 13-resolved replace/narrow/reset temporal delta against one
unique accepted query revision, validated with event, timezone, trusted `as_of`,
and endpoints before atomic state acceptance.

### Formal Wording

- "Replace the accepted temporal range with the previous calendar month."

### Normal Conversational Wording

- "What about last month?"

### Trader Slang

- "Run it back for the last 90 days."

### Abbreviations

- "same req, last 90d"

### Common Misspellings

- "now do lst moth"

### Noisy or Incomplete Input

- "only this week now"

### Singular and Plural Forms

- "that period" targets one accepted range; multiple periods require explicit typed comparison sides.

### Full Questions

- "Can you use the same accepted metrics but only this week?"

### Commands

- "Replace the accepted date range with the last 90 days."

### Sentence Fragments

- "what about June"

### Follow-Up Wording

- "Now do June" modifies time only when one accepted query is the unique compatible target.

### Correction Wording

- "No, replace July with June; don't combine the two periods."

### Comparison Wording

- "Use June instead for both accepted comparison sides" requires compatible side/event validation.

### Ranking Wording

- "Keep the accepted metric/sort/limit and rank only this week."

### Negated Wording

- "Not last month—this month" replaces the contradicted range after validation.

### Exclusion Wording

- "Use the same period except the opening hour" is a temporal/filter delta requiring explicit boundaries.

### Multi-Filter Wording

- "For June, only long trades under $5 outside premarket."

### Multi-Part Question Wording

- "Use June, keep net P&L, and group by weekday."

### Ambiguous Wording

- "Now" or "that time" is ambiguous without trusted `as_of`, timezone, event basis, or unique referent.

### Negative Examples

These examples must not map to `time_modification`.

- "Keep the same period" maps to `active_date_range` retention.
- "How long were my trades open?" requests a duration metric.

### Context Requirements

Require one accepted query/range revision, unique reference, exact Category 13
resolution, server-authorized account, trusted `as_of`, event/timezone/endpoints, and coverage.

### Required Data

- Source revision; proposed temporal expression; resolved bounds/count; event;
  timezone; trusted `as_of`; endpoint rules; authorization; and coverage.

### Optional Data

- Trusted typed page-date context may disambiguate; browser/device/server-local time never supplies authority.

### Valid Filters

- Retained filters must remain compatible with the new range/event/timezone and data availability.

### Valid Groupings

- Retained groupings must remain compatible with the new temporal grain and eligible population.

### Valid Operators

- Replace, narrow, or reset the accepted temporal range; corrections replace rather than silently intersect.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `inspect_data_quality`, and `assist_daily_review` when temporal scope applies.

### Incompatible Combinations

- Missing event/timezone/as-of/endpoints, guessed calendar/session, stale or
  cross-account state, hidden intersection, reversed bounds, or incompatible retained fields.

### Default Interpretation

No default period/year/event/timezone/as-of/session/endpoints exists. Without a
unique accepted target, interpret as a new question or clarify.

### Clarification Conditions

Ask first for the highest-impact unresolved temporal field after the accepted target is identified.

### Recommended Clarification Wording

- "Which date range should replace the accepted period?"

### Unsupported Conditions

- Missing/invalid range, unavailable calendar/session/event/timezone, stale
  `as_of`, unauthorized scope, or unsupported temporal capability.

### Target Analytics Tool or Query Capability

- Future context resolver plus Category 13 temporal/full-query validator; execution only after acceptance.

### Result Units

- Typed temporal delta with resolved local/UTC bounds or count, event, timezone,
  `as_of`, endpoints, source/next revision, and coverage.

### Fee Handling

- Time modification never changes the accepted fee/currency/gross-net contract.

### Open-Trade Handling

- Preserve event/lifecycle eligibility; missing open endpoints and `needs_decision` remain explicit.

### Sample-Size Considerations

- Recompute/report exact eligible population/counts/coverage for the accepted new range; no adequacy inference.

## `metric_modification` Language Registry

### Exact Definition

An explicit metric/set or approved basis/representation add/remove/replace delta
against one unique accepted query. Categories 2-10 own formula, unit, basis,
denominator, fees, currency, lifecycle, sample, and coverage; full validation precedes atomic acceptance.

### Formal Wording

- "Replace the accepted metric with net profit while retaining compatible fields."

### Normal Conversational Wording

- "Use net profit instead."

### Trader Slang

- "Show net instead of gross."

### Abbreviations

- "use NPnL, not GPnL" selects only locked metric/basis tokens after validation.

### Common Misspellings

- "what about expectncy"

### Noisy or Incomplete Input

- "same thing but net"

### Singular and Plural Forms

- "that metric" targets one accepted metric; "those metrics" requires one unique accepted ordered set.

### Full Questions

- "Can you replace gross P&L with net P&L in the accepted query?"

### Commands

- "Use expectancy instead and retain only compatible fields."

### Sentence Fragments

- "show percentages"

### Follow-Up Wording

- "What about expectancy?" is a modification only when one accepted analytical query is the unique target.

### Correction Wording

- "No, replace gross with net; don't keep both metrics."

### Comparison Wording

- "Use net P&L for the same accepted comparison sides" requires compatible basis/populations.

### Ranking Wording

- "Rank by expectancy instead" replaces the rank metric and revalidates direction, limit, ties, and population.

### Negated Wording

- "Not gross—use fee-complete net" is a replacement, never hidden dual basis.

### Exclusion Wording

- "Use net P&L excluding trades without complete fee coverage" retains visible coverage limitations.

### Multi-Filter Wording

- "Use expectancy for June long trades under $5 outside premarket."

### Multi-Part Question Wording

- "Use net P&L, keep June, and group by ticker."

### Ambiguous Wording

- "Show percentages" is ambiguous without an approved metric/denominator/representation.

### Negative Examples

These examples must not map to `metric_modification`.

- "Keep the same metrics" maps to `last_metric_or_metric_set` retention.
- "Give me more detail" maps to `detail_modification`.

### Context Requirements

Require one accepted query/metric revision, unique reference, locked metric owner,
complete formula/basis/denominator/fee/currency/lifecycle/sample contracts, authorization, and coverage.

### Required Data

- Source revision; explicit metric delta/target; locked metric contracts;
  dependent fields; authorization; capability; and coverage.

### Optional Data

- Accepted result digest may confirm compatibility but cannot supply a metric/basis from prose.

### Valid Filters

- Retained filters must remain valid for the replacement/additional metric's required fields/population.

### Valid Groupings

- Retained groupings must remain valid for the metric unit/grain/population/sample contract.

### Valid Operators

- Add only with explicit additive wording; remove; replace/correct; retain; or reset metric/basis representation.

### Compatible Intents

- `summarize_performance`, `calculate_metric`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `detect_pattern`, `explain_result`,
  `diagnose_performance`, `identify_strengths`, `evaluate_rule`,
  `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `inspect_data_quality`, and `assist_daily_review` when metric-bearing.

### Incompatible Combinations

- Unknown/unlocked metric, incompatible units/populations, missing denominator/
  fee/currency facts, hidden basis, stale/cross-account target, or unreset invalid dependencies.

### Default Interpretation

No default metric/set/formula/basis/denominator/fee/currency/sample exists. Never infer basis from prose or metric name.

### Clarification Conditions

After selecting one accepted target, ask the metric first. Only if its locked
contract still has multiple material bases, ask basis as a separate later focused question.

### Recommended Clarification Wording

- "Which metric should replace the accepted metric?"

### Unsupported Conditions

- Missing accepted target, unknown/unavailable metric, absent required basis/
  denominator/data, incompatible dependencies, stale/unauthorized scope, or unsupported tool.

### Target Analytics Tool or Query Capability

- Future context resolver plus locked metric/full-query validator; owning deterministic metric tool only after acceptance.

### Result Units

- Typed metric delta, locked formula/unit/basis/denominator/fee/currency/
  lifecycle/sample metadata, affected fields, source/next revision, and coverage.

### Fee Handling

- Preserve exact gross/before-fee or fee-complete net/after-fee, costs/credits,
  currency, allocation, completeness, and limitations; never infer or estimate.

### Open-Trade Handling

- Revalidate each metric's lifecycle eligibility; never mix open-supported and closed-only populations.

### Sample-Size Considerations

- Recompute exact eligible counts/population/coverage and apply only the locked owning metric/policy limitations.

## `grouping_modification` Language Registry

### Exact Definition

An explicit Category 11-owned add/replace/remove/refine/reset grouping delta
against one unique accepted query revision, with dimension/grain/definition,
population, missing/complement, authorization, and coverage validation before atomic acceptance.

### Formal Wording

- "Replace the accepted grouping with ticker while retaining compatible fields."

### Normal Conversational Wording

- "Now group it by ticker."

### Trader Slang

- "Split that out by weekday."

### Abbreviations

- "grp by tkr" proposes ticker grouping; `tkr` never guesses or rewrites an actual ticker symbol.

### Common Misspellings

- "break it down by weekdy"

### Noisy or Incomplete Input

- "same stats ticker split"

### Singular and Plural Forms

- "that group" targets one accepted bucket only when unique; "those groups" requires one accepted grouping contract.

### Full Questions

- "Can you keep the accepted query and break it down by weekday?"

### Commands

- "Replace the weekday grouping with ticker."

### Sentence Fragments

- "separate premarket and regular hours"

### Follow-Up Wording

- "Break that down" modifies grouping only when `that` uniquely identifies one accepted result/query.

### Correction Wording

- "No, replace weekday with ticker; don't keep both grouping levels."

### Comparison Wording

- "Use the new ticker groups within the accepted comparison only if both sides remain compatible."

### Ranking Wording

- "Rank the new ticker groups" retains only a separately validated metric/sort/limit/tie contract.

### Negated Wording

- "Not by weekday—group by ticker instead."

### Exclusion Wording

- "Group by session and keep missing-session coverage separate rather than inventing a bucket."

### Multi-Filter Wording

- "Group June long trades under $5 outside premarket by ticker."

### Multi-Part Question Wording

- "Group by ticker, keep net P&L, and show the accepted result in a table."

### Ambiguous Wording

- "Separate those" is ambiguous when `those` could be trades, filters, sides, tickers, or existing groups.

### Negative Examples

These examples must not map to `grouping_modification`.

- "Keep the same grouping" maps to `active_grouping` retention.
- "Only AAPL" is a filter/selection, not a grouping change.

### Context Requirements

Require one accepted query/grouping revision, unique reference, authorized
dimension/grain/definition version, population, missing/complement rules, compatible fields, and coverage.

### Required Data

- Source revision; explicit grouping delta; exact target/dimension/grain/version;
  dependent fields; account authorization; population; and coverage.

### Optional Data

- Trusted typed page grouping context may disambiguate after server validation; table layout/prose cannot.

### Valid Filters

- Retained filters must remain compatible with the new grouping grain/population and field availability.

### Valid Groupings

- Category 11-authorized dimensions/buckets/definition versions only; no inferred or raw-ID group.

### Valid Operators

- Add only when explicitly requested and compatible; replace/correct, remove, refine grain, or reset.

### Compatible Intents

- `group_and_aggregate`, `compare_groups`, `rank_results`,
  `summarize_performance`, `calculate_metric`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_sequence`, `analyze_trend`,
  `run_counterfactual`, `generate_coaching`, `inspect_data_quality`, and
  `assist_daily_review` when grouping-compatible.

### Incompatible Combinations

- Unknown/unauthorized dimension, incompatible grain/population, hidden multi-
  level accumulation, stale/cross-account target, raw-ID bucket, or invalid unreset dependencies.

### Default Interpretation

No default dimension/grain/bucket/missing/complement/sort/limit exists. Without one unique accepted target, treat as new or clarify.

### Clarification Conditions

Ask the grouping dimension first after the accepted target is selected; stage grain/definition only if still unresolved.

### Recommended Clarification Wording

- "Which grouping should replace the accepted grouping?"

### Unsupported Conditions

- Missing accepted target, unavailable/unauthorized dimension, invalid grain/
  definition, incompatible dependencies, stale/cross-account scope, or unsupported grouping tool.

### Target Analytics Tool or Query Capability

- Future context resolver plus Category 11 grouping/full-query validator; deterministic grouping only after acceptance.

### Result Units

- Typed grouping delta, ordered dimensions/grain/definition, missing/complement/
  population rules, affected fields, source/next revision, and coverage.

### Fee Handling

- Grouping changes never alter accepted gross/net, fee/credit, currency, allocation, or completeness.

### Open-Trade Handling

- Revalidate lifecycle eligibility by group; never merge closed/open/decision populations silently.

### Sample-Size Considerations

- Report exact eligible count/population/coverage per accepted group and only owning limitations.

## `detail_modification` Language Registry

### Exact Definition

A Category 18-owned response-mode/evidence-depth delta against one unique
accepted query and immutable result/snapshot revision. It changes presentation
only; query fields, exact values, truth, coverage, sort/limit, and basis remain unchanged.

### Formal Wording

- "Expand the accepted result's evidence without changing its query contract."

### Normal Conversational Wording

- "Give me more detail."

### Trader Slang

- "Show me the receipts behind that answer."

### Abbreviations

- "more dtl" changes detail only; it is not metric, basis, sort, limit, or ticker shorthand.

### Common Misspellings

- "explain how you calcualted it"

### Noisy or Incomplete Input

- "same answer more detail"

### Singular and Plural Forms

- "the answer" targets one accepted result; "the trades" means bounded evidence only when authorized by that result.

### Full Questions

- "Can you explain how the accepted result was calculated?"

### Commands

- "Just give me the answer without dropping material limitations."

### Sentence Fragments

- "show me the trades"

### Follow-Up Wording

- "Explain it" resolves only when `it` uniquely refers to one accepted result/snapshot.

### Correction Wording

- "No, keep the calculation; I only want a more detailed explanation."

### Comparison Wording

- "Show more detail for the accepted comparison without changing sides, metric, or basis."

### Ranking Wording

- "Put the accepted ranking in a table" preserves metric, direction, finite limit, ties, and coverage.

### Negated Wording

- "Don't recalculate it; only explain the accepted result."

### Exclusion Wording

- "Keep it brief but do not omit the sample or coverage limitation."

### Multi-Filter Wording

- "Show the supporting trades for the accepted June long-under-$5 result."

### Multi-Part Question Wording

- "Give the direct answer, then show privacy-safe evidence and the calculation."

### Ambiguous Wording

- "Show me more" is ambiguous when it could request more rows, another period, a larger limit, new metrics, or detail.

### Negative Examples

These examples must not map to `detail_modification`.

- "Show only the top ten" changes Category 14 result limit.
- "Use net P&L instead" maps to `metric_modification`.

### Context Requirements

Require one unique accepted query/result/snapshot revision, unchanged contract
digest, current authorization, exact values/counts/coverage/limitations, and privacy-safe evidence availability.

### Required Data

- Accepted query/result revisions; exact Category 18 mode delta; unchanged
  result digest; evidence permissions; account scope; capability; and coverage.

### Optional Data

- Privacy-safe bounded trade/evidence links may be rendered after current authorization revalidation.

### Valid Filters

- Accepted filters remain unchanged; detail never adds/removes predicates.

### Valid Groupings

- Accepted grouping remains unchanged; table mode renders only existing validated rows/groups.

### Valid Operators

- Replace response mode or expand/reduce bounded evidence depth; no analytical field delta.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `detect_pattern`,
  `explain_result`, `diagnose_performance`, `identify_strengths`,
  `evaluate_rule`, `evaluate_label`, `analyze_trade`, `find_similar_trades`,
  `analyze_sequence`, `analyze_trend`, `run_counterfactual`, `evaluate_goal`,
  `generate_coaching`, `explain_concept`, `inspect_data_quality`,
  `assist_journaling`, `product_help`, and `assist_daily_review` under their evidence boundaries.

### Incompatible Combinations

- Recalculation/new population, hidden query/metric/basis/sort/limit change,
  raw/private evidence, stale/cross-account result, fabricated row, causal inference, advice, or protected write.

### Default Interpretation

No default referent/mode/evidence access exists. Category 18 alone owns any mode default; detail cannot default analytical changes.

### Clarification Conditions

After one accepted result is identified, ask only which response mode/evidence depth is wanted; stage any other field separately.

### Recommended Clarification Wording

- "Which response detail mode do you want for the accepted result?"

### Unsupported Conditions

- Missing/stale/unauthorized accepted result, unavailable evidence shape,
  raw-ID request, privacy/policy conflict, or unsupported presentation capability.

### Target Analytics Tool or Query Capability

- Future context resolver plus Category 18 response/result validator and presentation layer; no new analytics/runtime.

### Result Units

- Typed mode/evidence-depth delta, accepted result/snapshot revisions, unchanged contract digest, coverage, and limitations.

### Fee Handling

- Preserve and disclose material exact gross/net, fee/credit, currency, allocation, completeness, and limitations.

### Open-Trade Handling

- Detail cannot change lifecycle eligibility or turn open/decision facts into closed evidence.

### Sample-Size Considerations

- Preserve exact eligible counts/population/coverage and limitations in every mode; never infer adequacy.

## `comparison_continuation` Language Registry

### Exact Definition

A follow-up against one unique accepted comparison and immutable result/snapshot
revision. It preserves exact sides, metric/basis, populations, counts, coverage,
and truth; any requested field change routes through its typed owner and validates before atomic acceptance.

### Formal Wording

- "Continue the accepted comparison by assessing its exact eligible sample coverage."

### Normal Conversational Wording

- "Which one was more consistent?"

### Trader Slang

- "What really separated those two groups?"

### Abbreviations

- "same comp, check N" means retain the accepted comparison and inspect exact eligible counts, not infer adequacy.

### Common Misspellings

- "is the sampel big enogh"

### Noisy or Incomplete Input

- "what caused diff"

### Singular and Plural Forms

- "the difference" targets one accepted comparison result; "those samples" requires its two exact accepted populations.

### Full Questions

- "Is the sample large enough under the owning metric policy?"

### Commands

- "Explain the supported difference without changing the accepted comparison."

### Sentence Fragments

- "which one more consistent"

### Follow-Up Wording

- "What about its sample?" resolves only when `its` uniquely identifies the accepted comparison/result.

### Correction Wording

- "No, keep the same sides; replace only the metric through the metric contract."

### Comparison Wording

- "What caused the difference?" permits only direct mechanical evidence or bounded association/unknown-cause wording.

### Ranking Wording

- "Which side ranked higher?" requires separately validated metric/direction/limit/ties; continuation cannot invent them.

### Negated Wording

- "Don't change the baseline; just explain the accepted difference."

### Exclusion Wording

- "Reassess the sample after the already accepted exclusions" preserves exact populations/coverage.

### Multi-Filter Wording

- "For the accepted June long-under-$5 comparison, is each side's sample sufficient under policy?"

### Multi-Part Question Wording

- "State the difference, exact side counts, coverage, and the owning sample limitation."

### Ambiguous Wording

- "Did I trade it better?" is ambiguous without selected entity, sides, period, comparison point, metric, and basis.

### Negative Examples

These examples must not map to `comparison_continuation`.

- "Compare long and short trades" creates a new `compare_groups` request.
- "This proves afternoons cause losses" is an unsupported causal claim.

### Context Requirements

Require one accepted comparison/result/snapshot revision, unique reference,
exact sides/metric/basis/populations/counts/exclusions/coverage/limitations,
current account authorization, and owner policy versions.

### Required Data

- Accepted comparison/result revisions; exact side definitions; metric/basis/
  units; eligible counts/populations/exclusions; coverage; limitations; and authorization.

### Optional Data

- Privacy-safe bounded evidence may support direct mechanism/association wording after validation.

### Valid Filters

- Retain the accepted side/filter definitions; any change routes through `filter_modification` and revalidates both sides.

### Valid Groupings

- Retain accepted compatible grouping/grain; any change routes through `grouping_modification`.

### Valid Operators

- Continue/explain/inspect exact accepted result; metric/filter/time/group/basis/sort/limit changes remain owner deltas.

### Compatible Intents

- `compare_groups`, `explain_result`, `diagnose_performance`,
  `summarize_performance`, `calculate_metric`, `group_and_aggregate`,
  `rank_results`, `detect_pattern`, `identify_strengths`, `evaluate_rule`,
  `evaluate_label`, `analyze_trade`, `analyze_sequence`, `analyze_trend`,
  `run_counterfactual`, `generate_coaching`, `inspect_data_quality`, and
  `assist_daily_review` when the accepted intent contract contains this comparison.

### Incompatible Combinations

- Missing/nonunique/stale comparison, cross-account/raw-ID side, hidden metric/
  basis/population/sort/limit change, incompatible samples, fabricated cause,
  advice/prediction, or tool execution before validation.

### Default Interpretation

No default comparison/result/side/metric/basis/baseline/period/cause/sample
threshold/sort/limit exists. Without a unique accepted target, treat as new or clarify.

### Clarification Conditions

Ask first which accepted comparison is intended; then ask the highest-impact
missing field separately, never a compound checklist.

### Recommended Clarification Wording

- "Which accepted comparison do you want to continue?"

### Unsupported Conditions

- Missing/stale/unauthorized comparison, unavailable metric/evidence/coverage,
  incompatible populations, undefined owning sample policy, causal/advisory request, or unsupported tool.

### Target Analytics Tool or Query Capability

- Future context resolver plus Category 14 comparison/result and policy validator;
  only approved deterministic tools after full acceptance, never from prose alone.

### Result Units

- Continuation kind, accepted comparison/result revisions, exact sides/metric/
  basis/units/counts/populations/exclusions/coverage/limitations, and any validated delta.

### Fee Handling

- Preserve identical exact gross/net, fee/credit, currency, allocation, and completeness contracts across sides.

### Open-Trade Handling

- Preserve identical lifecycle eligibility; do not add open facts to closed-only populations or admit `needs_decision`.

### Sample-Size Considerations

- Retain/revalidate exact side counts, eligible populations, exclusions,
  coverage, and owning thresholds/interpretation; never infer adequacy from prose or stale results.

## Language Registry Production Summary

All 18/18 exact source-order language registries are complete Version 1
`Planned` registries with all 38 required subsections. Registry Batches 1-3
independently PASSed, and the lead controller approved and locked all 18
registries on 2026-08-11. No runtime capability is authorized.

---

# 7. Evaluation Cases Deliverable

Evaluation Batches 1-6 contain `C15-E1` through `C15-E18`, each with all
22 standard case types in the required order and exact ordered schema. All 18
arrays and all 396 Version 1 `Planned` cases independently PASS. There are 0
failed, unreviewed, undrafted, or pending cases; overall Version 1 evaluation
PASS is recorded without runtime authorization.

## Evaluation Array C15-E1 -- last_intent

~~~json
[
  {"caseId":"C15-E1-01","caseType":"canonical","input":"Keep the intent from my latest accepted request and change only its already-resolved period.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","validate the explicit typed time delta before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","Category 13-resolved replacement period","accepted query remains unchanged until full validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Retain only typed accepted intent state; never reconstruct it from answer prose, recency, or a pending ambiguity."},
  {"caseId":"C15-E1-02","caseType":"formal_paraphrase","input":"Retain the primary and ordered secondary intents from the uniquely referenced accepted query while applying only the validated filter revision.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":["validated replacement filter set"],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","replace only the validated filter field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","Category 12-validated filter revision","atomic full-query acceptance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The accepted intent is preserved exactly; the filter owner validates the only requested delta."},
  {"caseId":"C15-E1-03","caseType":"conversational_paraphrase","input":"Use the same kind of accepted analysis, but break the covered result down by ticker.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted last_intent","add validated grouping without changing analytical truth"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","Category 11-authorized ticker grouping","compatible accepted population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The phrase same kind resolves only from one compatible accepted structured query, not conversational proximity."},
  {"caseId":"C15-E1-04","caseType":"trader_slang","input":"Run that accepted breakdown back with the morning filter and keep the request itself the same.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":["validated morning-session filter"],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","apply only the owner-validated filter delta"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted breakdown","exact locked Category 1 intent tokens","validated session filter semantics","atomic accepted-query update"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trader slang does not relax reference uniqueness, authorization, or filter validation."},
  {"caseId":"C15-E1-05","caseType":"abbreviation","input":"Same accepted req; swap only the validated grp to ticker.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted last_intent","replace only the validated grouping field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","authorized ticker grouping","full-query compatibility validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation recognition never supplies missing accepted state or a hidden grouping."},
  {"caseId":"C15-E1-06","caseType":"misspelling","input":"Keep the last accepted intnet and only change the already validated response detail.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","apply only the Category 18-owned detail delta"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","accepted response-mode modification","unchanged metric and population truth"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The misspelling may normalize to intent, but cannot alter facts, metrics, or the accepted intent token."},
  {"caseId":"C15-E1-07","caseType":"noisy_input","input":"same accepted thing... only ticker filter, nothing else pls","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":["validated ticker filter"],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","replace only the validated filter field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","server-authorized ticker operand","atomic accepted-query update"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not justify guessing a request, ticker, or account; the case presupposes a unique accepted target and validated operand."},
  {"caseId":"C15-E1-08","caseType":"command","input":"Retain the accepted analyze-trend intent and replace only its compatible grouping through validation.","expectedPrimaryIntent":"analyze_trend","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":["validated compatible grouping"],"expectedOperators":["retain accepted last_intent","replace only the validated grouping field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted trend request","exact locked Category 1 intent tokens","grouping compatibility with accepted trend contract","atomic full-query acceptance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A command cannot override capability, evidence, authorization, or coverage gates."},
  {"caseId":"C15-E1-09","caseType":"fragment","input":"same accepted summary, different validated filter","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":["validated replacement filter set"],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","replace only the validated filter field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted summary","exact locked Category 1 intent tokens","Category 12-valid filter delta","accepted revision provenance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A fragment is resolvable only because the typed accepted target and explicit compatible delta are supplied by trusted context."},
  {"caseId":"C15-E1-10","caseType":"follow_up","input":"For that uniquely referenced accepted result, keep what I asked and show the same facts with more detail.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","change only validated response detail"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted result reference","exact locked Category 1 intent tokens","Category 18 response-detail contract","unchanged result contract digest and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"More detail may change presentation only; it cannot recalculate or reinterpret the accepted result."},
  {"caseId":"C15-E1-11","caseType":"correction","input":"No, keep the accepted summary intent; I was correcting only the authorized ticker filter.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":["corrected validated ticker filter"],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","replace the prior attempted filter correction only after validation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","server-authorized corrected ticker operand","rejected attempt did not mutate accepted state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction updates the current query only and never rewrites a global definition or accepted state before validation."},
  {"caseId":"C15-E1-12","caseType":"comparison","input":"Keep the accepted compare-groups intent and its exact two sides; change only the validated response detail.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","preserve accepted comparison sides","change only validated response detail"],"expectedComparison":"retained accepted comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison query","same server-authorized account scope","unique compatible accepted comparison","exact locked Category 1 intent tokens","unchanged sides metric basis populations and coverage","Category 18 response-detail contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison wording retains only the accepted typed comparison; it creates no side, cause, or recommendation."},
  {"caseId":"C15-E1-13","caseType":"ranking","input":"Use the same accepted rank-results request and change only the authorized grouping; preserve its approved sort, limit, and tie contract.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":["validated authorized grouping"],"expectedOperators":["retain accepted last_intent","preserve accepted sort limit and privacy-safe ties","replace only the validated grouping field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted ranking query","same server-authorized account scope","unique compatible accepted ranking","exact locked Category 1 intent tokens","Category 14 sort limit and tie contract","grouping compatibility validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Intent retention does not invent ranking direction, a result limit, or tie handling."},
  {"caseId":"C15-E1-14","caseType":"negation","input":"Do not change the accepted intent or metric; remove only the already validated premarket filter.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":["accepted filters with validated premarket predicate removed"],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","remove only the validated filter predicate"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","Category 12-valid filter removal","unchanged accepted metric contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation scopes the explicit delta and does not reset unrelated accepted fields."},
  {"caseId":"C15-E1-15","caseType":"exclusion","input":"Continue the accepted retrieve-records request while excluding only the authorized ticker named in the validated filter change.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":["accepted filters plus validated ticker exclusion"],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","add only the validated exclusion predicate"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted retrieval query","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","server-authorized ticker operand","Category 12 predicate validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The exclusion cannot broaden scope or silently alter the retained intent, range, grouping, or basis."},
  {"caseId":"C15-E1-16","caseType":"multi_filter","input":"Keep the accepted summary request and apply the validated long-side, under-five-dollar, and outside-premarket filters together.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":["validated long-side filter","validated under-five-dollar filter","validated outside-premarket filter"],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","apply the validated predicate tree with explicit precedence"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","Category 12 field operator operand validation","compatible population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple filters are one validated typed delta; no conversational default or hidden precedence is allowed."},
  {"caseId":"C15-E1-17","caseType":"multi_part","input":"Retain the accepted summarize-performance intent, add the validated ticker grouping, and present the unchanged result contract in a table.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted last_intent","add validated grouping","apply validated table response mode without changing truth"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted request","exact locked Category 1 intent tokens","Category 11 grouping contract","Category 18 response-mode contract","unchanged result digest and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each explicit part is validated by its owner before one complete atomic accepted-query update."},
  {"caseId":"C15-E1-18","caseType":"ambiguous","input":"Do that accepted analysis again.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["multiple or missing compatible accepted request candidates","same server-authorized account scope","pending ambiguity tied to unchanged accepted revision","no accepted intent value supplied by the pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which earlier accepted request do you want to continue?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one focused target question first; do not choose by recency, prose proximity, or a stale answer."},
  {"caseId":"C15-E1-19","caseType":"negative_example","input":"What does an intent mean in the language inventory?","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat as a new concept explanation request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no prior accepted query required","do not read or mutate last_intent"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fail closed against context retention: this new question does not map to last_intent."},
  {"caseId":"C15-E1-20","caseType":"unsupported_data","input":"Pull the last accepted request from a different Journal account and reuse its intent here.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account context carryover"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized conversation account scope","account isolation","no raw or private identifier fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Accepted intent state cannot be read from or moved across a different Journal-account scope.","notes":"Fail closed without confirming whether any other account or request exists; accepted state remains unchanged."},
  {"caseId":"C15-E1-21","caseType":"selected_entity_context","input":"For the trusted selected trade, keep its uniquely referenced accepted analyze-trade request and show the same facts with more detail.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_intent"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted last_intent","change only validated response detail"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected trade in current authorized scope","latest complete accepted analyze-trade query","unique compatible selected-context reference","exact locked Category 1 intent tokens","server-side entity revalidation","unchanged result contract digest and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The trusted typed selection may identify the accepted request; no raw ID, page prose, or stale selection authorizes access."},
  {"caseId":"C15-E1-22","caseType":"cross_category","input":"Keep the accepted summarize-performance intent and metric contract, then add the authorized ticker grouping without changing its accepted range or coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["last_intent","last_metric_or_metric_set","active_date_range"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted last_intent","retain accepted metric and temporal contracts","add only the validated grouping"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","exact locked Category 1 intent tokens","locked metric owner contract","Category 13-resolved accepted temporal contract","Category 11-authorized ticker grouping","full-query compatibility and coverage validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each category keeps ownership; context carries compatible accepted state and cannot alter formulas, dates, authorization, or analytical truth."}
]
~~~

## Evaluation Array C15-E2 -- last_metric_or_metric_set

~~~json
[
  {"caseId":"C15-E2-01","caseType":"canonical","input":"Keep the exact accepted metric set and all of its owner contracts while changing only the validated grouping.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":[],"expectedGroupings":["validated compatible grouping"],"expectedOperators":["retain ordered accepted metric set","validate grouping compatibility before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked metric tokens and formula owners","exact units basis denominator lifecycle currency fee sample and coverage contracts","accepted query remains unchanged until full validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Retain the complete typed metric contract, not values or labels reconstructed from an answer."},
  {"caseId":"C15-E2-02","caseType":"formal_paraphrase","input":"Preserve the ordered metrics from the uniquely referenced accepted query, including each formula, unit, basis, denominator, fee, currency, lifecycle, sample, and coverage contract.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","preserve every locked metric-owner field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked metric tokens and formula owners","exact units basis denominator lifecycle currency fee sample and coverage contracts","current capability and data coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No default metric, basis, denominator, conversion, fee state, or sample population is permitted."},
  {"caseId":"C15-E2-03","caseType":"conversational_paraphrase","input":"Use the same accepted net P&L and win-rate metrics, but split the compatible covered result by ticker.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","group_and_aggregate"],"expectedCanonicalConcepts":["last_metric_or_metric_set","net_pnl","win_rate"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain ordered accepted metric set","add validated compatible grouping"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked net_pnl and win_rate owner contracts","exact units basis denominator lifecycle currency fee sample and coverage contracts","Category 11-authorized ticker grouping"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The named accepted metrics are retained in order; grouping cannot alter either formula or eligible population silently."},
  {"caseId":"C15-E2-04","caseType":"trader_slang","input":"Same accepted P&L stats, just run the validated morning-session cut without switching the fee basis.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":["validated morning-session filter"],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","apply only the validated filter delta","preserve accepted fee basis"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked metric tokens and formula owners","exact gross or fee-complete net basis and currency","compatible eligible population counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang cannot imply which metrics or fee basis to use; this case explicitly retains one accepted contract."},
  {"caseId":"C15-E2-05","caseType":"abbreviation","input":"Keep accepted NPnL plus WR; change only the validated ticker grp.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","group_and_aggregate"],"expectedCanonicalConcepts":["last_metric_or_metric_set","net_pnl","win_rate"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain ordered accepted metric set","add validated compatible grouping"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked net_pnl and win_rate owner contracts","exact basis denominator currency fee lifecycle sample and coverage metadata","Category 11-authorized ticker grouping"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognized abbreviations resolve to locked tokens only within the explicit accepted metric contract."},
  {"caseId":"C15-E2-06","caseType":"misspelling","input":"Keep the same accepted metrc set and its exact basis; only update the validated filter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":["validated replacement filter set"],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","replace only the validated filter field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked metric tokens and formula owners","exact units basis denominator lifecycle currency fee sample and coverage contracts","filter compatibility with every retained metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A misspelling may normalize, but cannot supply a missing metric, basis, denominator, or formula."},
  {"caseId":"C15-E2-07","caseType":"noisy_input","input":"same accepted stats... ticker split only, keep fee math exactly","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","group_and_aggregate"],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain ordered accepted metric set","add validated compatible grouping","preserve accepted fee and credit treatment"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked metric tokens and formula owners","exact fee cost fee credit allocation currency and completeness contract","compatible grouping population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy wording does not permit fee substitution, arithmetic invention, or prose-derived metrics."},
  {"caseId":"C15-E2-08","caseType":"command","input":"Retain accepted expectancy with its own eligible-ready-closed denominator, then apply only the validated grouping.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["last_metric_or_metric_set","expectancy"],"expectedFilters":["eligible ready closed population required by accepted expectancy contract"],"expectedGroupings":["validated compatible grouping"],"expectedOperators":["retain ordered accepted metric set","preserve owner denominator","validate grouping before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted expectancy target","locked expectancy formula and own nonzero eligible denominator","exact basis units lifecycle sample and coverage contract","zero-denominator unavailable handling"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric retention preserves the exact owner denominator and unavailable state; it never converts zero denominator to zero expectancy."},
  {"caseId":"C15-E2-09","caseType":"fragment","input":"same accepted metrics, validated filter change only","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":["validated replacement filter set"],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","replace only the validated filter field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked metric tokens and formula owners","exact units basis denominator lifecycle currency fee sample and coverage contracts","full-query validation after filter replacement"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is valid only with one typed accepted target and an owner-valid explicit delta."},
  {"caseId":"C15-E2-10","caseType":"follow_up","input":"For that unique accepted result, keep its exact metrics and show the unchanged calculations with more detail.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","change only validated response detail","preserve accepted result contract digest"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query and result revision","same server-authorized account scope","unique compatible accepted result reference","locked metric tokens and formula owners","exact units basis denominator lifecycle currency fee sample and coverage contracts","unchanged mathematical values and factual snapshot"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An explanation follow-up reuses the accepted calculation contract and cannot change analysis or claim cause."},
  {"caseId":"C15-E2-11","caseType":"correction","input":"No, keep accepted net P&L; I corrected the grouping, not the metric or its fee-complete basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["last_metric_or_metric_set","net_pnl"],"expectedFilters":[],"expectedGroupings":["corrected validated grouping"],"expectedOperators":["retain ordered accepted metric set","preserve fee-complete net basis","replace only the validated grouping field"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked net_pnl formula owner","exact gross P/L minus allocated charge costs plus allocated charge credits in compatible currency","rejected correction did not mutate accepted state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction is query-local; it cannot redefine net P/L or infer a fee basis."},
  {"caseId":"C15-E2-12","caseType":"comparison","input":"Keep the accepted net-P&L and win-rate contracts on both comparison sides; change only the validated side label presentation.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["last_metric_or_metric_set","net_pnl","win_rate"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","preserve side-specific populations","change presentation only after validation"],"expectedComparison":"retained accepted comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison query","same server-authorized account scope","unique compatible accepted comparison","locked net_pnl and win_rate owner contracts","same compatible basis units currency and fee completeness across sides","exact side counts populations and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric retention cannot manufacture comparable sides or hide basis, denominator, or coverage differences."},
  {"caseId":"C15-E2-13","caseType":"ranking","input":"Rank the authorized groups by the same uniquely accepted net-P&L metric and basis, preserving its existing privacy-safe ordering contract.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["last_metric_or_metric_set","net_pnl"],"expectedFilters":[],"expectedGroupings":["retained authorized groups"],"expectedOperators":["retain ordered accepted metric set","preserve accepted sort limit and privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted ranking query","same server-authorized account scope","unique compatible accepted metric target","locked net_pnl formula owner","exact accepted basis currency fee allocation and coverage","Category 14 sort limit and tie contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Same metric does not supply missing rank direction, limit, grouping, or tie policy."},
  {"caseId":"C15-E2-14","caseType":"negation","input":"Do not replace the accepted metric set or fee basis; remove only the validated session filter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":["accepted filters with validated session predicate removed"],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","preserve accepted metric basis","remove only the validated filter predicate"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked metric tokens and formula owners","exact units basis denominator lifecycle currency fee sample and coverage contracts","Category 12-valid predicate removal"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation constrains the delta and leaves every unmentioned accepted metric field unchanged."},
  {"caseId":"C15-E2-15","caseType":"exclusion","input":"Keep the accepted win-rate metric and exclude only records already marked unavailable under its eligible-population contract.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_metric_or_metric_set","win_rate"],"expectedFilters":["accepted win-rate eligible population with unavailable records disclosed as exclusions"],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","apply only owner-valid exclusion","preserve denominator and coverage disclosure"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted win-rate target","locked win_rate numerator and denominator","exact eligible closed population counts exclusions and coverage","zero-denominator unavailable handling"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An exclusion cannot silently improve the metric; requested, eligible, excluded, and unavailable counts remain visible."},
  {"caseId":"C15-E2-16","caseType":"multi_filter","input":"Retain accepted net P&L and win rate for the validated long-side, under-five-dollar, and outside-premarket population.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["last_metric_or_metric_set","net_pnl","win_rate"],"expectedFilters":["validated long-side filter","validated under-five-dollar filter","validated outside-premarket filter"],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","apply validated predicate tree with explicit precedence"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted metric target","locked net_pnl and win_rate owner contracts","metric-compatible filter fields and operands","exact eligible counts exclusions fee coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All retained metrics must remain compatible with the entire filtered population; no hidden intersection is allowed."},
  {"caseId":"C15-E2-17","caseType":"multi_part","input":"Keep accepted net P&L and expectancy, add the validated weekday grouping, and explain both unchanged owner formulas and coverage.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric","group_and_aggregate"],"expectedCanonicalConcepts":["last_metric_or_metric_set","net_pnl","expectancy"],"expectedFilters":[],"expectedGroupings":["validated weekday groups"],"expectedOperators":["retain ordered accepted metric set","add validated compatible grouping","explain unchanged accepted formulas and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query and result revision","same server-authorized account scope","locked net_pnl and expectancy owner contracts","compatible grouping grain and populations","exact fee currency denominator sample and coverage metadata","unchanged result contract digest"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each owner validates its part before one complete revision; explanation adds no cause, advice, or new arithmetic."},
  {"caseId":"C15-E2-18","caseType":"ambiguous","input":"Keep the same accepted stats for this follow-up.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["multiple accepted metric sets or unresolved accepted target","same server-authorized account scope","pending ambiguity tied to unchanged accepted revision","no metric or basis value supplied by the pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which accepted metric should stay in this follow-up?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask the highest-impact metric field first; any still-material basis question is a separate later clarification."},
  {"caseId":"C15-E2-19","caseType":"negative_example","input":"Use expectancy instead of the metric in the accepted query.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","expectancy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace metric only through the locked metric owner and full-query validator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit new metric request","locked expectancy formula denominator population and coverage contract","accepted query unchanged until replacement validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fail closed against retention: this maps to metric_modification and does not reuse last_metric_or_metric_set."},
  {"caseId":"C15-E2-20","caseType":"unsupported_data","input":"Recover the same metrics from a stale answer in another account's conversation and use them here.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_metric_or_metric_set"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject prose-derived stale cross-account metric state"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized conversation account scope","current accepted structured state","account isolation","no stale transcript or raw identifier fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A stale cross-account answer cannot supply an accepted metric token or any formula, basis, denominator, fee, currency, sample, or coverage contract.","notes":"Fail closed without disclosing other conversations or inventing the missing metric contract."},
  {"caseId":"C15-E2-21","caseType":"selected_entity_context","input":"For the trusted selected trade, retain the uniquely accepted net-P&L and return-on-risk contracts used in its current analysis.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["last_metric_or_metric_set","net_pnl","return_on_risk"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain ordered accepted metric set","revalidate selected-entity compatibility"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected trade in current authorized scope","latest complete accepted analyze-trade query","unique compatible metric target","locked net_pnl and return_on_risk owner contracts","exact basis denominator currency fee lifecycle sample and coverage metadata","server-side entity revalidation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The selected trade helps identify a typed accepted metric contract; no raw ID, selection prose, or stale page state authorizes it."},
  {"caseId":"C15-E2-22","caseType":"cross_category","input":"Keep accepted fee-complete net P&L and win rate, retain the accepted date range, and group the compatible covered population by authorized ticker.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","group_and_aggregate"],"expectedCanonicalConcepts":["last_metric_or_metric_set","net_pnl","win_rate","active_date_range"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain ordered accepted metric set","retain accepted temporal contract","add validated compatible grouping"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","locked net_pnl and win_rate owner contracts","exact fee cost fee credit currency denominator lifecycle sample and coverage metadata","Category 13-resolved accepted temporal contract","Category 11-authorized ticker grouping","full-query compatibility validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric, time, grouping, and context owners remain separate; carrying accepted state cannot invent conversions, dates, filters, or analytical support."}
]
~~~

## Evaluation Array C15-E3 -- active_date_range

~~~json
[
  {"caseId":"C15-E3-01","caseType":"canonical","input":"Retain the exact accepted date-range contract and change only the validated grouping.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":["validated compatible grouping"],"expectedOperators":["retain accepted active_date_range","validate grouping compatibility before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved bounds or finite record window","accepted event basis timezone trusted server as_of inclusivity and calendar semantics","current coverage and accepted-state provenance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Retain typed accepted temporal state exactly; never rebuild it from prose, recency, or a device clock."},
  {"caseId":"C15-E3-02","caseType":"formal_paraphrase","input":"Preserve the uniquely referenced accepted temporal selection, including event basis, endpoints, inclusivity, timezone, trusted as-of, and calendar or window semantics.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_date_range","preserve every Category 13-owned field"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","resolved local and UTC bounds or ordered-record count","accepted event basis IANA timezone trusted server as_of and inclusivity","coverage and accepted-state revision"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No date, year, event basis, timezone, endpoint, or as-of is inferred by the evaluation."},
  {"caseId":"C15-E3-03","caseType":"conversational_paraphrase","input":"Keep the same accepted dates and split the compatible covered result by ticker.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted active_date_range","add validated compatible grouping"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved temporal contract","Category 11-authorized ticker grouping","compatible event grain population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Same dates resolves only from one accepted typed range; it does not choose the nearest prior period."},
  {"caseId":"C15-E3-04","caseType":"trader_slang","input":"Keep that accepted window locked and just cut the covered facts by morning versus afternoon.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":["validated morning and afternoon session groups"],"expectedOperators":["retain accepted active_date_range","add owner-validated session grouping"],"expectedComparison":"validated morning-versus-afternoon comparison within the retained range","expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved temporal contract","validated session definitions and timezone","compatible side populations counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trader slang cannot redefine the accepted window or invent session boundaries."},
  {"caseId":"C15-E3-05","caseType":"abbreviation","input":"Same accepted 30d rng; validated ticker grp only.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted active_date_range","add validated compatible grouping"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision whose temporal expression is an accepted 30-day range","same server-authorized account scope","unique compatible accepted temporal target","accepted event basis timezone trusted server as_of endpoints and window semantics","Category 11-authorized ticker grouping","compatible population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation identifies only the already accepted typed range; no evaluation date or rolling anchor is invented."},
  {"caseId":"C15-E3-06","caseType":"misspelling","input":"Use the same accepted date ragne and change only the validated response detail.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_date_range","change only validated response detail"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved temporal contract","Category 18 response-detail contract","unchanged facts result digest and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A misspelling may normalize to range but cannot supply missing temporal fields or alter analytical truth."},
  {"caseId":"C15-E3-07","caseType":"noisy_input","input":"same accepted dates... ticker split, dont move the window","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted active_date_range","add validated compatible grouping"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","resolved temporal bounds event basis timezone as_of and inclusivity","Category 11-authorized ticker grouping","atomic full-query acceptance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy language does not permit hidden range intersection, date drift, or browser-clock fallback."},
  {"caseId":"C15-E3-08","caseType":"command","input":"Retain the accepted execution-time range exactly and replace only the compatible validated filter set.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":["validated replacement filter set"],"expectedGroupings":[],"expectedOperators":["retain accepted active_date_range","replace only the validated filter field"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted retrieval query","same server-authorized account scope","unique compatible accepted temporal target","accepted execution-time event basis","resolved bounds IANA timezone trusted server as_of and inclusivity","filter compatibility and coverage validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command explicitly retains one accepted event basis; it cannot switch to trade-close, journal, or display time."},
  {"caseId":"C15-E3-09","caseType":"fragment","input":"same accepted period, validated weekday grouping","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":["validated weekday groups"],"expectedOperators":["retain accepted active_date_range","add validated compatible grouping"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved temporal contract","weekday grouping in the accepted IANA timezone","compatible grain population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is valid only because the accepted range and grouping semantics are typed and uniquely identified."},
  {"caseId":"C15-E3-10","caseType":"follow_up","input":"For that uniquely referenced accepted result, keep its exact temporal range and explain the unchanged coverage in more detail.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_date_range","change only validated response detail","preserve accepted result contract digest"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query and result revision","same server-authorized account scope","unique compatible accepted result reference","Category 13-resolved temporal contract","unchanged factual snapshot eligible counts exclusions and coverage","Category 18 response-detail contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explanation cannot shift endpoints, change event basis, recalculate facts, or claim cause."},
  {"caseId":"C15-E3-11","caseType":"correction","input":"No, the accepted range was right; I meant to correct only the metric through its locked owner.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range","metric_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_date_range","replace only the owner-validated metric field"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved temporal contract","locked replacement metric contract","rejected correction did not mutate accepted state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction preserves the accepted range and updates only the current query after full validation."},
  {"caseId":"C15-E3-12","caseType":"comparison","input":"Within the same accepted range, compare the two validated groups without changing event basis, timezone, endpoints, or coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":["two validated comparison groups"],"expectedOperators":["retain accepted active_date_range","compare validated side-specific populations"],"expectedComparison":"validated two-group comparison within the retained range","expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved temporal contract","Category 14 comparison sides metric basis and equality contract","exact side populations counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Temporal retention neither invents the comparison nor permits incompatible side ranges or hidden baselines."},
  {"caseId":"C15-E3-13","caseType":"ranking","input":"For the exact accepted range, rank the authorized groups with the already accepted metric, sort, limit, and privacy-safe tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":["retained authorized groups"],"expectedOperators":["retain accepted active_date_range","preserve accepted ranking sort limit and privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted ranking query","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved temporal contract","accepted locked metric and basis","Category 14 sort limit tie and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Retaining a period cannot create ranking direction, a metric, limit, group set, or tie policy."},
  {"caseId":"C15-E3-14","caseType":"negation","input":"Do not change the accepted range or timezone; remove only the validated premarket predicate.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":["accepted filters with validated premarket predicate removed"],"expectedGroupings":[],"expectedOperators":["retain accepted active_date_range","remove only the validated filter predicate"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved temporal contract","Category 12-valid predicate removal","unchanged temporal endpoints and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation preserves every accepted temporal field and changes no hidden session or calendar definition."},
  {"caseId":"C15-E3-15","caseType":"exclusion","input":"Keep the accepted period and exclude only records outside its already accepted endpoint and event-basis contract.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":["records within the retained accepted temporal contract"],"expectedGroupings":[],"expectedOperators":["retain accepted active_date_range","apply accepted temporal bounds without widening or shifting them"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted retrieval query","same server-authorized account scope","unique compatible accepted temporal target","resolved bounds event basis timezone as_of and inclusivity","exact requested eligible excluded and unavailable counts","coverage including missing temporal facts and decision-bound records"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Range exclusion is descriptive filtering; missing endpoints remain unavailable rather than invented matches."},
  {"caseId":"C15-E3-16","caseType":"multi_filter","input":"Use the same accepted range with the validated long-side, under-five-dollar, and outside-premarket filters.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":["validated long-side filter","validated under-five-dollar filter","validated outside-premarket filter"],"expectedGroupings":[],"expectedOperators":["retain accepted active_date_range","apply validated predicate tree with explicit precedence"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted temporal target","Category 13-resolved temporal contract","Category 12-valid fields operators operands and precedence","compatible eligible population counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The filter tree cannot silently intersect a different range, timezone, or event basis."},
  {"caseId":"C15-E3-17","caseType":"multi_part","input":"Retain the accepted range, group its compatible covered population by weekday, and explain the unchanged timezone and endpoint coverage.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":["validated weekday groups"],"expectedOperators":["retain accepted active_date_range","add validated compatible grouping","explain unchanged temporal coverage"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query and result revision","same server-authorized account scope","Category 13-resolved temporal contract","weekday grouping in accepted IANA timezone","exact eligible counts exclusions and coverage","unchanged result contract digest"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each explicit part validates before one atomic revision; explanation cannot alter dates or analytical truth."},
  {"caseId":"C15-E3-18","caseType":"ambiguous","input":"Use that accepted time again.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["multiple or missing compatible accepted temporal candidates","same server-authorized account scope","pending ambiguity tied to unchanged accepted revision","no date range event basis timezone or endpoint supplied by the pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which accepted date range do you want to keep?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one focused temporal-target question first; do not choose a range, session, duration, or execution time by recency."},
  {"caseId":"C15-E3-19","caseType":"negative_example","input":"What about last month instead of the accepted range?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve explicit replacement period through Category 13 before full-query validation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit new temporal expression","trusted server as_of","authorized account IANA timezone","accepted event basis or focused clarification","accepted query unchanged until replacement validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fail closed against retention: this maps to time_modification; no actual dates or replacement range are invented here."},
  {"caseId":"C15-E3-20","caseType":"unsupported_data","input":"Recreate the accepted range from my laptop clock and an old screenshot after the structured state is gone.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject device-clock and stale-prose temporal reconstruction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["current accepted structured temporal state required","trusted server as_of required","server-authorized IANA timezone required","no screenshot browser device or server-local clock fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A device clock and stale screenshot cannot supply an accepted event basis, bounds, timezone, trusted as-of, inclusivity, or calendar contract.","notes":"Fail closed without fabricating a period or confirming private historical context."},
  {"caseId":"C15-E3-21","caseType":"selected_entity_context","input":"For the trusted selected journal entry, retain the exact accepted date range used by its uniquely referenced current analysis.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_date_range","revalidate selected-entity and temporal compatibility"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":"server-validated selected journal entry","expectedContextRequirements":["trusted typed selected journal entry in current authorized scope","latest complete accepted query revision","unique compatible temporal target","Category 13-resolved event bounds timezone as_of inclusivity and calendar contract","server-side entity revalidation","current coverage and accepted-state provenance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The typed selection may identify one accepted range; no raw identifier, page prose, or inferred entry date supplies it."},
  {"caseId":"C15-E3-22","caseType":"cross_category","input":"Retain the accepted date range and fee-complete net-P&L contract, then group the compatible covered facts by authorized ticker without changing event basis.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","group_and_aggregate"],"expectedCanonicalConcepts":["active_date_range","last_metric_or_metric_set","net_pnl"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted active_date_range","retain accepted net-P&L contract","add validated compatible grouping"],"expectedComparison":null,"expectedTimeRange":"retained accepted active date range","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","Category 13-resolved temporal contract","locked net_pnl formula basis currency fee allocation and coverage contract","Category 11-authorized ticker grouping","full-query event grain population and coverage compatibility"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Context carries compatible accepted fields while temporal, metric, and grouping owners retain exact semantics; no dates, cause, advice, or runtime is created."}
]
~~~

## Evaluation Array C15-E4 -- active_filters

~~~json
[
  {"caseId":"C15-E4-01","caseType":"canonical","input":"Keep the exact accepted filter tree and change only the already-validated metric.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":[],"expectedOperators":["retain accepted active_filters","replace only the validated metric field after full-query validation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted filter target","authorized Category 11 fields","Category 12 operators and normalized typed operands","explicit boolean grouping and precedence","eligible population and coverage","accepted query unchanged until atomic validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Retain the complete accepted predicate tree; no clause, operand, precedence, missing-data truth value, or account scope is reconstructed from prose."},
  {"caseId":"C15-E4-02","caseType":"formal_paraphrase","input":"Retain the validator-accepted predicates, inclusions, exclusions, and precedence while replacing only the authorized grouping.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":["validated replacement grouping"],"expectedOperators":["retain accepted active_filters","replace only the grouping field after compatibility validation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted filter target","exact field operator operand and precedence semantics","Category 11 grouping authorization","compatible population grain and coverage","atomic accepted revision"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The grouping delta neither adds a predicate nor changes the meaning or order of any retained predicate."},
  {"caseId":"C15-E4-03","caseType":"conversational_paraphrase","input":"Use those same accepted filters again, but show the covered result by weekday.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":["validated weekday groups"],"expectedOperators":["resolve one unique accepted filter reference","retain accepted active_filters","add compatible authorized grouping"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","one unique compatible predicate-tree referent","authorized weekday grouping and timezone contract","unchanged eligible population semantics","current missing-fact and coverage reporting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Those resolves only from trusted typed accepted state, never from visible chips, response prose, or conversational proximity alone."},
  {"caseId":"C15-E4-04","caseType":"trader_slang","input":"Same accepted cut, longs under five and no premarket; just give me the detailed view.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted long-side predicate","retained accepted under-five-dollar predicate","retained accepted premarket exclusion"],"expectedGroupings":[],"expectedOperators":["retain accepted active_filters","change only validated response detail"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted slang-matched predicate tree","exact typed operands and boolean precedence","Category 18 detail contract","unchanged analytical result and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang normalization cannot broaden a price threshold, change session semantics, or accumulate a hidden predicate."},
  {"caseId":"C15-E4-05","caseType":"abbreviation","input":"Keep the accepted fltrs and swap only the metric to net P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters","net_pnl"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":[],"expectedOperators":["retain accepted active_filters","replace only the validated metric contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted filter target","locked net_pnl formula gross P&L minus allocated charge_cost plus allocated charge_credit","one compatible currency partition or approved conversion","fee completeness allocation conservation eligible counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation may normalize to filters; it cannot infer a fee basis, currency, missing charge, or alternate population."},
  {"caseId":"C15-E4-06","caseType":"misspelling","input":"Keep teh same accepted fitlers and use the validated June range.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":[],"expectedOperators":["retain accepted active_filters","replace only the Category 13-resolved time range"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted filter target","Category 13-resolved bounds event basis timezone as_of inclusivity and calendar contract","filter compatibility with replacement period","atomic full-query validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Spelling recovery does not permit a default timezone, endpoint, event basis, or stale filter reconstruction."},
  {"caseId":"C15-E4-07","caseType":"noisy_input","input":"same accepted filters pls... ticker breakdown only, nothing else","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted active_filters","add only the validated ticker grouping"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted predicate tree","server-authorized ticker grouping","explicit missing and other behavior","unchanged predicate precedence population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not authorize a ticker operand, raw identifier, filter reset, or grouping inferred from page layout."},
  {"caseId":"C15-E4-08","caseType":"command","input":"Retain every accepted predicate and rerun the accepted summary for the validated prior period.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":[],"expectedOperators":["retain accepted active_filters","apply only the validated replacement period after full-query validation"],"expectedComparison":null,"expectedTimeRange":"validated prior-period temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted filter target","resolved prior-period temporal contract","field and operand availability in replacement period","current eligible counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A command does not bypass validation or claim that any future parser or query runtime exists."},
  {"caseId":"C15-E4-09","caseType":"fragment","input":"same accepted predicates, June only","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":[],"expectedOperators":["resolve unique accepted filter target","retain accepted active_filters","replace only validated time range"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible filter referent","Category 13 temporal validation","unchanged field operator operand precedence semantics","atomic accepted revision"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is usable only with trusted typed context and cannot supply a missing predicate or period contract."},
  {"caseId":"C15-E4-10","caseType":"follow_up","input":"Use that uniquely referenced accepted filter set again and show the same factual result with more detail.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":[],"expectedOperators":["retain accepted active_filters","change only validated response detail"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query and result revisions","same server-authorized account scope","unique compatible accepted filter target","Category 18 response-detail contract","unchanged result-contract digest","exact eligible counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"More detail changes presentation only and never recalculates, broadens, or explains cause from the retained predicates."},
  {"caseId":"C15-E4-11","caseType":"correction","input":"No, keep the accepted long and price predicates; replace the accepted session predicate with the validated regular-hours predicate.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters","filter_modification"],"expectedFilters":["retained accepted long-side predicate","retained accepted price predicate","validated regular-hours predicate replacing the prior session predicate"],"expectedGroupings":[],"expectedOperators":["replace only the uniquely targeted accepted session predicate","preserve all untargeted predicates and precedence","accept atomically after Category 12 validation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted session-predicate target","authorized session field operator and operand","no simultaneous old and replacement session predicate","full-query compatibility and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replaces the targeted predicate; it does not append the replacement beside the contradicted value or mutate unrelated clauses."},
  {"caseId":"C15-E4-12","caseType":"comparison","input":"With the exact accepted filters, compare the separately defined long and short populations using the accepted fee-complete net-P&L basis.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_filters","active_comparison","net_pnl"],"expectedFilters":["retained accepted ordered typed predicate tree applied compatibly to both sides"],"expectedGroupings":[],"expectedOperators":["retain accepted active_filters","validate separate left and right populations","calculate signed left-minus-right difference under accepted equality semantics"],"expectedComparison":{"left":"validated long population","right":"validated short population","basis":"fee-complete net P&L"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separately defined compatible side populations","locked net_pnl formula gross P&L minus allocated charge_cost plus allocated charge_credit","compatible currency fee allocation and lifecycle eligibility","eligible sample counts exclusions coverage and limitations per side","no causal interpretation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Retained filters apply consistently to separately defined sides; they do not collapse both sides into one population or establish causation."},
  {"caseId":"C15-E4-13","caseType":"ranking","input":"Keep the accepted filters and rank the authorized ticker groups by the accepted metric, sort, positive limit, and privacy-safe tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain accepted active_filters","apply accepted metric and direction","apply accepted positive integer limit and privacy-safe tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted ranking query revision","same server-authorized account scope","unique accepted filter target","Category 11 grouping authorization","Category 14 metric direction limit and tie contract","per-group eligible counts coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filter retention supplies no default grouping, rank direction, limit, or tie policy."},
  {"caseId":"C15-E4-14","caseType":"negation","input":"Do not remove or broaden any accepted filter; change only the validated response format.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":[],"expectedOperators":["retain every accepted predicate and precedence relation","change only validated response format"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted filter target","Category 18 format contract","unchanged accepted query and result truth","current coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation preserves the accepted tree exactly and cannot convert missing facts into nonmatches or matches."},
  {"caseId":"C15-E4-15","caseType":"exclusion","input":"Retain the accepted filter tree, including its validated ticker exclusion, without adding any new exclusion.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted predicate tree including validated ticker exclusion"],"expectedGroupings":[],"expectedOperators":["retain accepted inclusion exclusion and negation semantics","preserve explicit boolean precedence"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted retrieval query","same server-authorized account scope","unique accepted filter target","server-validated ticker operand","exact eligible excluded missing and decision-bound counts","no hidden exclusion accumulation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The accepted exclusion is retained as typed state; no raw value, visible chip, or prose list creates another exclusion."},
  {"caseId":"C15-E4-16","caseType":"multi_filter","input":"Keep the accepted long-side, under-five-dollar, and outside-premarket predicates with their exact validated precedence.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted long-side predicate","retained accepted under-five-dollar predicate","retained accepted outside-premarket predicate"],"expectedGroupings":[],"expectedOperators":["retain complete ordered predicate tree","preserve validated boolean grouping and precedence"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted filter set","exact fields operators operands inclusion and exclusion","missing-fact handling by owning fields","eligible population exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The three predicates remain the already accepted tree, not a newly inferred conjunction with default precedence."},
  {"caseId":"C15-E4-17","caseType":"multi_part","input":"Keep the exact accepted filters, use the validated June range, group the compatible population by weekday, and state the unchanged coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate","explain_result"],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":["validated weekday groups"],"expectedOperators":["retain accepted active_filters","replace only validated period","add only validated compatible grouping","report exact coverage without changing truth"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","Category 13 temporal contract","Category 11 weekday grouping and timezone contract","full-query compatibility validation","exact eligible excluded missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All explicit deltas validate together before one atomic revision; no partially accepted filter or query state is exposed."},
  {"caseId":"C15-E4-18","caseType":"ambiguous","input":"Keep those accepted conditions.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["multiple or missing compatible accepted condition referents","same server-authorized account scope","pending ambiguity tied to unchanged accepted revision","no accepted predicate field operator operand or precedence supplied by pending state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which accepted filter set do you want to keep?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the filter-set target first; do not choose filters, reconstruct them from prose, or accept any value while ambiguity remains."},
  {"caseId":"C15-E4-19","caseType":"negative_example","input":"Add an under-five-dollar filter to the accepted query.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and validate explicit new predicate through Category 12","replace accepted revision only after full-query validation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit filter-addition delta","authorized price field and typed operand","explicit boolean placement and precedence","accepted query unchanged until atomic validation","eligible population and coverage revalidation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fail closed against retention: this is filter_modification, and the new predicate cannot silently accumulate in active_filters before acceptance."},
  {"caseId":"C15-E4-20","caseType":"unsupported_data","input":"Rebuild my old filters from a screenshot and raw account identifier after the accepted state is gone.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject stale-prose screenshot and raw-identifier reconstruction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["current accepted typed predicate tree required","current server authorization required","field operator operand precedence and population contracts required","no screenshot prose raw-ID or cross-account fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A screenshot and raw account identifier cannot recreate an authorized accepted predicate tree, typed operands, precedence, population, revision, or coverage.","notes":"Fail closed without echoing the identifier, inventing filters, or claiming a parser or query runtime."},
  {"caseId":"C15-E4-21","caseType":"selected_entity_context","input":"For the trusted selected trade, retain only the exact accepted filter tree from its uniquely referenced current analysis.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_filters"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":[],"expectedOperators":["retain accepted active_filters","revalidate selected-entity filter compatibility"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected trade in current authorized scope","latest complete accepted query revision","unique compatible accepted filter target","server-side entity revalidation","exact predicate and population contracts","current coverage and privacy-safe provenance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The trusted selection may identify one accepted filter tree; no raw trade ID, page prose, or selected-value inference supplies predicates."},
  {"caseId":"C15-E4-22","caseType":"cross_category","input":"Retain the accepted filters and fee-complete net-P&L contract, then use the validated prior-month range without changing grouping or account scope.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_filters","last_metric_or_metric_set","net_pnl"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":[],"expectedOperators":["retain accepted active_filters","retain accepted net-P&L contract","replace only validated time range"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","Category 12 predicate contract","locked net_pnl formula currency fee allocation and coverage contract","Category 13 prior-month temporal contract","full-query population grain and lifecycle compatibility"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filter, metric, time, grouping, and account owners remain separate; no hidden clause, date, basis, cause, advice, or runtime is created."}
]
~~~

## Evaluation Array C15-E5 -- active_comparison

~~~json
[
  {"caseId":"C15-E5-01","caseType":"canonical","input":"Keep the exact accepted comparison contract and change only the validated response detail.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","change only validated response detail"],"expectedComparison":{"left":"retained accepted left side","right":"retained accepted right side","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","unique compatible accepted comparison target","exact side definitions and separate populations","metric basis units currency fee and lifecycle contracts","difference equality and optional denominator rules","eligible counts coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Retain the full typed comparison; presentation cannot change sides, populations, metric, basis, denominator, result truth, or limitations."},
  {"caseId":"C15-E5-02","caseType":"formal_paraphrase","input":"Retain the validator-accepted sides, populations, metric basis, and difference semantics while replacing only the authorized period.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison structure","replace only the validated temporal field","revalidate both side populations atomically"],"expectedComparison":{"left":"retained accepted left-side definition","right":"retained accepted right-side definition","basis":"retained accepted compatible metric basis"},"expectedTimeRange":"validated replacement temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison revision","same server-authorized account scope","unique accepted comparison target","Category 13 replacement-period contract","separate compatible side populations in replacement period","unchanged difference equality and denominator semantics","side counts coverage and limitations revalidated"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A period delta creates a new validated comparison revision; it does not reuse stale result values or alter side definitions."},
  {"caseId":"C15-E5-03","caseType":"conversational_paraphrase","input":"Use that same accepted comparison again and show me the factual records behind each side.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["compare_groups"],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve one unique accepted comparison reference","retain accepted active_comparison","retrieve privacy-safe evidence within each accepted side"],"expectedComparison":{"left":"retained accepted left side","right":"retained accepted right side","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","one unique compatible comparison referent","current authorization for bounded underlying records","exact side membership and exclusions","privacy-safe output coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Evidence retrieval stays descriptive and bounded; it cannot expose raw IDs, move records between sides, or explain cause."},
  {"caseId":"C15-E5-04","caseType":"trader_slang","input":"Same accepted long-versus-short matchup; just give me the receipts for both covered sides.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["compare_groups"],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","retrieve authorized privacy-safe side evidence"],"expectedComparison":{"left":"retained accepted long-side population","right":"retained accepted short-side population","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","unique accepted long-versus-short target","server-revalidated side memberships","identical compatible metric currency fee and lifecycle contracts","exact eligible counts exclusions coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Receipts means bounded supporting records, not hidden identifiers, causation, advice, or a new comparison."},
  {"caseId":"C15-E5-05","caseType":"abbreviation","input":"Keep the accepted L versus S comparison and switch only to the validated table view.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","change only validated response format"],"expectedComparison":{"left":"retained accepted long-side definition","right":"retained accepted short-side definition","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","unique accepted abbreviation-matched comparison","Category 18 table-format contract","unchanged side values difference and equality truth","current counts coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation recognition cannot infer what L or S means without the unique accepted typed sides."},
  {"caseId":"C15-E5-06","caseType":"misspelling","input":"Keep the same accepted comparsion and explain only its documented coverage limitation.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups"],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","explain recorded coverage limitation without changing result"],"expectedComparison":{"left":"retained accepted left side","right":"retained accepted right side","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","unique accepted comparison target","exact side eligible and covered counts","recorded exclusions unavailable facts and policy limitation","unchanged result-contract digest","no causal inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Spelling recovery does not authorize a causal explanation or a change to sample adequacy, side membership, or analytical truth."},
  {"caseId":"C15-E5-07","caseType":"noisy_input","input":"same accepted compare... more detail on each side pls, no changes","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","increase only validated response detail"],"expectedComparison":{"left":"retained accepted left side","right":"retained accepted right side","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","unique compatible comparison referent","Category 18 detail contract","unchanged typed side and result contracts","current coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not supply a missing side, metric, denominator, time range, or basis."},
  {"caseId":"C15-E5-08","caseType":"command","input":"Retain the accepted comparison and present its unchanged signed difference with exact side counts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","report accepted signed left-minus-right difference","report exact eligible and covered side counts"],"expectedComparison":{"left":"retained accepted left side","right":"retained accepted right side","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","unique accepted comparison target","accepted signed-difference and equality rules","separate side populations and counts","current coverage exclusions and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command reports accepted deterministic facts only; it does not execute an unapproved tool or reinterpret direction."},
  {"caseId":"C15-E5-09","caseType":"fragment","input":"same accepted comparison, detailed side counts","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve unique accepted comparison target","retain accepted active_comparison","show exact side counts and coverage"],"expectedComparison":{"left":"retained accepted left side","right":"retained accepted right side","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","unique compatible comparison referent","separate exact eligible populations","covered excluded missing and unavailable counts","accepted sample limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is resolvable only from trusted typed state, never from a nearby table or stale prose."},
  {"caseId":"C15-E5-10","caseType":"follow_up","input":"For that uniquely referenced accepted comparison, keep every side and basis field and show the same result in a concise summary.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","change only validated response detail to concise"],"expectedComparison":{"left":"retained accepted left side","right":"retained accepted right side","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","unique accepted comparison reference","Category 18 concise-detail contract","unchanged result-contract digest","material coverage and limitations still disclosed"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Concise presentation cannot omit a material limitation or change comparison truth."},
  {"caseId":"C15-E5-11","caseType":"correction","input":"No, keep the accepted sides; replace only the contradicted gross basis with the validated fee-complete net-P&L basis.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_comparison","metric_modification","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace only the uniquely targeted accepted metric basis","preserve accepted side definitions","revalidate both populations and result atomically"],"expectedComparison":{"left":"retained accepted left-side definition","right":"retained accepted right-side definition","basis":"validated fee-complete net P&L replacing gross basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison revision","same server-authorized account scope","unique contradicted basis target","locked net_pnl formula gross P&L minus allocated charge_cost plus allocated charge_credit","compatible currency and conserving allocation on both sides","no simultaneous old and replacement basis","counts coverage and limitations recalculated"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replaces the targeted basis; it never accumulates gross and net bases or silently reuses the old result."},
  {"caseId":"C15-E5-12","caseType":"comparison","input":"Retain the accepted June-versus-May comparison with its separately defined populations and fee-complete net-P&L contract.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_comparison","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","preserve signed left-minus-right and equality semantics"],"expectedComparison":{"left":"retained accepted June population","right":"retained accepted May population","basis":"retained fee-complete net P&L"},"expectedTimeRange":"retained accepted June and May temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate compatible period populations","locked net_pnl formula gross P&L minus allocated charge_cost plus allocated charge_credit","compatible currency fee allocation event and lifecycle contracts","meaningful nonzero denominator only if percentage was accepted","side counts coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Period labels are part of the accepted typed contract; no device date, implicit percentage baseline, or stale value is introduced."},
  {"caseId":"C15-E5-13","caseType":"ranking","input":"Keep the accepted comparison sides, then rank their authorized ticker groups by the separately accepted metric, direction, limit, and privacy-safe ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["compare_groups","group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups within each retained side"],"expectedOperators":["retain accepted active_comparison","apply separately validated ranking contract","preserve side-specific populations and coverage"],"expectedComparison":{"left":"retained accepted left side","right":"retained accepted right side","basis":"retained accepted comparison metric basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison revision","same server-authorized account scope","Category 11 grouping authorization","Category 14 metric direction positive limit and tie contract","compatible side-specific ranked populations","per-side and per-group counts coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison retention supplies no rank direction, limit, or tie rule and cannot merge the side populations."},
  {"caseId":"C15-E5-14","caseType":"negation","input":"Do not change the accepted sides, metric basis, denominator rule, or equality semantics; change only presentation.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain complete accepted active_comparison","change only validated response presentation"],"expectedComparison":{"left":"retained accepted left side","right":"retained accepted right side","basis":"retained accepted metric basis and denominator rule"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison and result revisions","same server-authorized account scope","unique accepted comparison target","unchanged signed difference equality and percentage semantics","Category 18 presentation contract","current side counts coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation blocks hidden analytical changes; presentation cannot supply an absent denominator or cause."},
  {"caseId":"C15-E5-15","caseType":"exclusion","input":"Keep the accepted comparison but retain its validated exclusion of fee-incomplete records from both compatible sides.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":["retained accepted fee-completeness exclusion applied compatibly to both sides"],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","preserve identical validated exclusion rule across sides"],"expectedComparison":{"left":"retained accepted covered left population","right":"retained accepted covered right population","basis":"retained fee-complete metric basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison revision","same server-authorized account scope","identical fee-coverage eligibility on both sides","exact excluded and eligible counts per side","compatible currency and allocation contracts","partial and unavailable coverage disclosed"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The retained exclusion cannot hide excluded counts, estimate missing fees, or alter one side differently."},
  {"caseId":"C15-E5-16","caseType":"multi_filter","input":"Keep the accepted long-versus-short comparison for under-five-dollar trades outside premarket with the same validated predicates on both sides.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":["retained accepted under-five-dollar predicate","retained accepted outside-premarket predicate"],"expectedGroupings":[],"expectedOperators":["retain accepted side definitions","retain compatible predicate tree on both sides","preserve accepted difference semantics"],"expectedComparison":{"left":"retained accepted long-side population","right":"retained accepted short-side population","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison revision","same server-authorized account scope","exact typed price and session predicates","separate long and short populations after shared filters","compatible metric fee currency and lifecycle contracts","side counts exclusions coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Shared filters do not erase the separately defined comparison sides or create a causal interpretation."},
  {"caseId":"C15-E5-17","caseType":"multi_part","input":"Keep the accepted comparison, use the validated June period, show exact side counts, and explain only the recorded sample limitation.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted comparison structure","replace only validated period","revalidate side counts and result","explain recorded limitation without changing truth"],"expectedComparison":{"left":"retained accepted left-side definition","right":"retained accepted right-side definition","basis":"retained accepted metric and basis"},"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted comparison revision","same server-authorized account scope","Category 13 June contract","separate compatible side populations","exact eligible covered excluded and unavailable counts","owning sample policy and limitation","atomic full-comparison acceptance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Every explicit delta validates before one revision; explanation cannot invent adequacy, mechanism, or cause."},
  {"caseId":"C15-E5-18","caseType":"ambiguous","input":"Keep that accepted comparison.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["multiple or missing compatible accepted comparison referents","same server-authorized account scope","pending ambiguity tied to unchanged accepted revision","no side baseline metric basis population denominator or period supplied by pending state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which accepted comparison do you want to keep?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the comparison target first; do not choose a comparison or accept any comparison field while ambiguity remains."},
  {"caseId":"C15-E5-19","caseType":"negative_example","input":"Compare long and short trades by gross expectancy for the validated June period.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["create and validate a new typed comparison contract","calculate each side gross before-fee expectancy as sum of gross P&L divided by that side own eligible ready_closed count","exclude allocated charge_cost and allocated charge_credit","calculate signed left-minus-right difference and absolute magnitude","apply fixed equality semantics"],"expectedComparison":{"left":"new validated long population","right":"new validated short population","basis":"gross before-fee expectancy"},"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["explicit new comparison request","same server-authorized account scope","separate eligible ready_closed side populations","compatible recorded-currency partition","each side own nonzero eligible ready_closed count denominator","zero denominator makes that side unavailable","exact eligible covered excluded and unavailable side counts","side-specific coverage and limitations","accepted state unchanged until full validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fail closed against retention: this valid explicit gross-expectancy request creates a new comparison and must not read, retain, or overwrite an unrelated active_comparison before atomic acceptance."},
  {"caseId":"C15-E5-20","caseType":"unsupported_data","input":"Recreate the accepted comparison from stale prose and compare it with another account's hidden result.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject stale-prose and cross-account comparison reconstruction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["current accepted typed comparison required","same current server-authorized account scope required","exact sides metric basis populations and coverage required","no hidden result raw-ID or cross-account fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Stale prose and another account's hidden result cannot supply an authorized accepted comparison, compatible populations, metric basis, denominator, counts, or coverage.","notes":"Fail closed without exposing other-account facts, inventing a baseline, or claiming runtime access."},
  {"caseId":"C15-E5-21","caseType":"selected_entity_context","input":"For the trusted selected trade, retain the exact accepted comparison from its uniquely referenced current analysis.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["compare_groups"],"expectedCanonicalConcepts":["active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","revalidate selected-entity and comparison compatibility"],"expectedComparison":{"left":"retained accepted selected-trade side","right":"retained accepted compatible baseline side","basis":"retained accepted metric and basis"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected trade in current authorized scope","latest complete accepted comparison revision","unique compatible comparison target","server-side entity and baseline revalidation","exact side populations metric basis counts and coverage","privacy-safe accepted-state provenance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The selection may identify one accepted comparison; it cannot supply a raw identifier, similarity rule, baseline, or metric from page prose."},
  {"caseId":"C15-E5-22","caseType":"cross_category","input":"Retain the accepted fee-complete net-P&L comparison and filters, then present its unchanged signed difference in the validated concise format.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_comparison","active_filters","net_pnl"],"expectedFilters":["retained accepted predicate tree applied compatibly to both sides"],"expectedGroupings":[],"expectedOperators":["retain accepted active_comparison","retain accepted active_filters","retain accepted net-P&L contract","change only validated presentation detail"],"expectedComparison":{"left":"retained accepted left population","right":"retained accepted right population","basis":"fee-complete net P&L"},"expectedTimeRange":"retained accepted comparison time and event contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query and result revisions","same server-authorized account scope","locked net_pnl formula currency fee allocation and coverage contract","Category 12 predicate contract","Category 14 side difference equality and denominator contract","Category 18 concise-detail contract","side counts and material limitations retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison, filter, metric, and presentation owners remain exact; no hidden side, percentage, cause, advice, or runtime is created."}
]
~~~

## Evaluation Array C15-E6 -- active_grouping

~~~json
[
  {"caseId":"C15-E6-01","caseType":"canonical","input":"Keep the exact accepted grouping and change only the validated metric.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":[],"expectedGroupings":["retained accepted ordered authorized grouping"],"expectedOperators":["retain accepted active_grouping","replace only the validated metric after full-query compatibility validation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted grouping target","exact Category 11 dimension order and grain","bucket and definition versions","missing other and complement behavior","eligible population event basis and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Retain the typed grouping contract; no dimension, bucket, grain, order, or missing-value rule comes from prose or layout."},
  {"caseId":"C15-E6-02","caseType":"formal_paraphrase","input":"Retain the validator-accepted grouping dimensions, order, grain, and bucket versions while replacing only the authorized filter tree.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":["validated replacement ordered typed predicate tree"],"expectedGroupings":["retained accepted ordered authorized grouping"],"expectedOperators":["retain accepted active_grouping","replace only the filter field after compatibility validation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted grouping target","Category 12 filter validation","grouping compatibility with replacement population","unchanged dimension versions and missing behavior","atomic accepted revision and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The filter delta neither appends a grouping nor changes the retained grouping's grain or buckets."},
  {"caseId":"C15-E6-03","caseType":"conversational_paraphrase","input":"Use that same accepted breakdown again, but calculate fee-complete net P&L for each covered group.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_grouping","net_pnl"],"expectedFilters":[],"expectedGroupings":["retained accepted ordered authorized grouping"],"expectedOperators":["resolve one unique accepted grouping reference","retain accepted active_grouping","replace only the validated metric contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible grouping referent","locked net_pnl formula gross P&L minus allocated charge_cost plus allocated charge_credit","compatible currency and conserving allocation","per-group eligible counts fee completeness and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Same breakdown resolves only from trusted typed accepted state and never invents a group, fee, credit, or currency conversion."},
  {"caseId":"C15-E6-04","caseType":"trader_slang","input":"Same accepted ticker split, just show net for every covered bucket.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_grouping","net_pnl"],"expectedFilters":[],"expectedGroupings":["retained accepted authorized ticker groups"],"expectedOperators":["retain accepted active_grouping","replace only the validated metric contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted ticker grouping","locked net_pnl formula gross P&L minus allocated charge_cost plus allocated charge_credit","recorded-currency partitions or approved conversion","exact per-group counts missing buckets fee coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trader slang cannot convert a selected ticker into a grouping, expose raw IDs, or infer net treatment."},
  {"caseId":"C15-E6-05","caseType":"abbreviation","input":"Keep the accepted grp and swap only the period to validated June.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":[],"expectedGroupings":["retained accepted ordered authorized grouping"],"expectedOperators":["retain accepted active_grouping","replace only the Category 13-resolved period"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted grouping target","Category 13 bounds event basis timezone and inclusivity","group definition validity in replacement period","per-group population and coverage revalidation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation may normalize to grouping but cannot supply a timezone, event basis, dimension, or hidden bucket."},
  {"caseId":"C15-E6-06","caseType":"misspelling","input":"Keep the same accepted groupping and exclude premarket through the validated filter owner.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":["validated premarket exclusion predicate"],"expectedGroupings":["retained accepted ordered authorized grouping"],"expectedOperators":["retain accepted active_grouping","add only the validated filter predicate after full-query validation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted grouping target","Category 12 session predicate contract","grouping population compatibility","exact per-group excluded missing and covered counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Misspelling recovery cannot change the grouping or silently treat missing session facts as excluded."},
  {"caseId":"C15-E6-07","caseType":"noisy_input","input":"same accepted groups pls... June range only, leave buckets alone","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":[],"expectedGroupings":["retained accepted ordered authorized grouping"],"expectedOperators":["retain accepted active_grouping","replace only validated time range"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible accepted grouping","Category 13 temporal contract","unchanged bucket definitions order and missing behavior","atomic population and coverage revalidation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not authorize a bucket inferred from answer rows or selected page context."},
  {"caseId":"C15-E6-08","caseType":"command","input":"Retain the accepted weekday grouping and present its unchanged covered values in a table.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":[],"expectedGroupings":["retained accepted weekday groups"],"expectedOperators":["retain accepted active_grouping","change only validated response format"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query and result revisions","same server-authorized account scope","unique accepted weekday grouping","accepted IANA timezone and event basis","Category 18 table-format contract","unchanged per-group values counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A table layout cannot create, reorder, merge, or rename analytical groups."},
  {"caseId":"C15-E6-09","caseType":"fragment","input":"same accepted ticker groups, net P&L instead","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_grouping","net_pnl"],"expectedFilters":[],"expectedGroupings":["retained accepted authorized ticker groups"],"expectedOperators":["resolve unique accepted grouping target","retain accepted active_grouping","replace only validated metric"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique compatible ticker grouping","locked net_pnl formula and basis","currency fee allocation and completeness contract","per-group eligible counts coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is resolvable only with a trusted grouping target and complete metric contract; it cannot infer either from visible rows."},
  {"caseId":"C15-E6-10","caseType":"follow_up","input":"For that uniquely referenced accepted breakdown, keep its exact groups and show the same facts with more detail.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":[],"expectedGroupings":["retained accepted ordered authorized grouping"],"expectedOperators":["retain accepted active_grouping","change only validated response detail"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query and result revisions","same server-authorized account scope","unique compatible grouping reference","Category 18 response-detail contract","unchanged result-contract digest","per-group counts missing values coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"More detail cannot add a drilldown dimension or alter the underlying grouping or metric truth."},
  {"caseId":"C15-E6-11","caseType":"correction","input":"No, keep the accepted ticker grouping; replace only the contradicted weekday grouping target in the pending change.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping","grouping_modification"],"expectedFilters":[],"expectedGroupings":["retained accepted authorized ticker groups"],"expectedOperators":["replace the pending contradicted grouping target with retained ticker grouping","do not append weekday grouping","validate full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted ticker-grouping target","unique pending contradicted weekday target","authorized ticker definition and grain","no simultaneous ticker-plus-weekday accumulation","population and coverage compatibility"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replaces the targeted pending grouping value; it never accumulates the contradicted dimension or changes accepted state before validation."},
  {"caseId":"C15-E6-12","caseType":"comparison","input":"Within the exact accepted weekday groups, compare separately defined long and short populations using the accepted gross-expectancy contract.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["active_grouping","active_comparison","expectancy"],"expectedFilters":[],"expectedGroupings":["retained accepted weekday groups"],"expectedOperators":["retain accepted active_grouping","validate separate long and short populations per group","calculate each side gross before-fee expectancy as sum of gross P&L divided by that side own eligible ready_closed count","exclude allocated charge_cost and allocated charge_credit","calculate signed left-minus-right difference and absolute magnitude per group","apply fixed equality semantics"],"expectedComparison":{"left":"validated long population within each retained group","right":"validated short population within each retained group","basis":"gross before-fee expectancy"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted weekday timezone and event basis","separate compatible side populations per group","compatible recorded-currency partition","each side own nonzero eligible ready_closed count denominator per group","zero denominator makes that group side unavailable","exact eligible covered excluded and unavailable side counts per group","per-group side-specific coverage and limitations","no causal interpretation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The grouping partitions each side without making populations identical or proving that weekday causes the difference; accepted gross expectancy remains before fees and credits."},
  {"caseId":"C15-E6-13","caseType":"ranking","input":"Rank the exact accepted ticker groups by the separately accepted fee-complete net-P&L metric, direction, positive limit, and privacy-safe ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["active_grouping","net_pnl"],"expectedFilters":[],"expectedGroupings":["retained accepted authorized ticker groups"],"expectedOperators":["retain accepted active_grouping","apply accepted metric and ranking direction","apply accepted positive integer limit and privacy-safe tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted ranking query revision","same server-authorized account scope","unique accepted grouping target","locked net_pnl formula currency fee allocation and lifecycle contract","Category 14 direction limit and tie contract","per-group eligible counts coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping retention supplies no default sort, limit, or tie rule and exposes no raw identifier to resolve ties."},
  {"caseId":"C15-E6-14","caseType":"negation","input":"Do not change the accepted grouping order, grain, buckets, or missing-value behavior; change only the validated period.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":[],"expectedGroupings":["retained accepted ordered authorized grouping"],"expectedOperators":["retain complete accepted active_grouping","replace only validated time range"],"expectedComparison":null,"expectedTimeRange":"validated replacement temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted grouping target","Category 13 temporal contract","unchanged dimension and definition versions","population coverage and bucket availability revalidated"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation blocks hidden regrouping, rebucketing, reordering, or default missing-value assignment."},
  {"caseId":"C15-E6-15","caseType":"exclusion","input":"Keep the accepted ticker grouping and retain its validated missing-ticker exclusion with exact excluded counts.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":["retained accepted missing-ticker exclusion"],"expectedGroupings":["retained accepted authorized ticker groups"],"expectedOperators":["retain accepted active_grouping","preserve accepted missing-value exclusion behavior","report exact excluded count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","unique accepted ticker grouping","accepted missing other and complement rules","exact eligible grouped excluded and unavailable counts","no invented unknown bucket"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The exclusion remains explicit and countable; missing facts are never silently assigned to a ticker or treated as zero."},
  {"caseId":"C15-E6-16","caseType":"multi_filter","input":"Keep the accepted ticker grouping for long trades under five dollars outside premarket, with the validated predicate tree unchanged.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping","active_filters"],"expectedFilters":["retained accepted long-side predicate","retained accepted under-five-dollar predicate","retained accepted outside-premarket predicate"],"expectedGroupings":["retained accepted authorized ticker groups"],"expectedOperators":["retain accepted active_grouping","retain accepted active_filters and precedence"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","exact Category 12 predicate tree","Category 11 ticker grouping definition","compatible grain and eligible population","per-group missing excluded and covered counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters and grouping remain separate accepted fields; neither is reconstructed or silently accumulated from the other."},
  {"caseId":"C15-E6-17","caseType":"multi_part","input":"Keep the accepted weekday groups, use the validated June range, calculate fee-complete net P&L, and state each group's coverage.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["active_grouping","net_pnl"],"expectedFilters":[],"expectedGroupings":["retained accepted weekday groups"],"expectedOperators":["retain accepted active_grouping","replace only validated period and metric fields","report exact per-group coverage"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","accepted weekday timezone event and bucket contract","Category 13 June contract","locked net_pnl formula currency fee allocation and lifecycle contract","per-group eligible covered partial unavailable and excluded counts","atomic full-query acceptance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Every explicit delta validates before one accepted revision; coverage disclosure cannot alter bucket membership or metric truth."},
  {"caseId":"C15-E6-18","caseType":"ambiguous","input":"Keep those accepted groups.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["multiple or missing compatible accepted grouping referents","same server-authorized account scope","pending ambiguity tied to unchanged accepted revision","no accepted dimension order grain bucket or missing behavior supplied by pending state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which accepted grouping do you want to keep?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the grouping target first; do not choose a dimension, infer groups from rows, or accept a grouping value while ambiguity remains."},
  {"caseId":"C15-E6-19","caseType":"negative_example","input":"Now group the accepted result by ticker instead of weekday.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["validated replacement authorized ticker grouping"],"expectedOperators":["replace the accepted weekday grouping with ticker grouping","validate full query before atomic acceptance","do not retain both dimensions unless explicitly requested and compatible"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit grouping-replacement delta","same server-authorized account scope","authorized ticker dimension and definition version","unique accepted weekday target","compatible intent metric grain population and coverage","accepted state unchanged until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fail closed against retention: this is grouping_modification, and the new grouping replaces rather than secretly accumulating beside weekday."},
  {"caseId":"C15-E6-20","caseType":"unsupported_data","input":"Rebuild the accepted groups from a stale chart legend and another account's raw identifiers.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject stale-layout raw-identifier and cross-account grouping reconstruction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["current accepted typed grouping required","current server authorization required","dimension order grain versions population and coverage required","no chart legend raw-ID or other-account fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A stale chart legend and another account's raw identifiers cannot supply an authorized accepted grouping, dimension versions, grain, population, missing behavior, or coverage.","notes":"Fail closed without echoing identifiers, inventing buckets, or claiming grouping/query runtime access."},
  {"caseId":"C15-E6-21","caseType":"selected_entity_context","input":"For the trusted selected journal entry, retain the exact accepted grouping from its uniquely referenced current analysis.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["active_grouping"],"expectedFilters":[],"expectedGroupings":["retained accepted ordered authorized grouping"],"expectedOperators":["retain accepted active_grouping","revalidate selected-entity grouping compatibility"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected journal entry","expectedContextRequirements":["trusted typed selected journal entry in current authorized scope","latest complete accepted query revision","unique compatible grouping target","server-side entity revalidation","exact grouping population grain and definition contract","current coverage and privacy-safe provenance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The typed selection may identify one accepted grouping; it cannot turn the selected value into a group or supply raw IDs from page prose."},
  {"caseId":"C15-E6-22","caseType":"cross_category","input":"Retain the accepted ticker grouping and filters, use the validated prior-month range, and calculate fee-complete net P&L without changing sort or account scope.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["active_grouping","active_filters","net_pnl"],"expectedFilters":["retained accepted ordered typed predicate tree"],"expectedGroupings":["retained accepted authorized ticker groups"],"expectedOperators":["retain accepted active_grouping","retain accepted active_filters","replace only validated time and metric fields","preserve any accepted sort separately"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-authorized account scope","Category 11 grouping contract","Category 12 predicate contract","Category 13 temporal contract","locked net_pnl formula currency fee allocation and coverage contract","per-group compatible population counts and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping, filters, time, metric, sort, and account owners remain separate; no hidden bucket, ranking, cause, advice, or runtime is created."}
]
~~~

## Evaluation Array C15-E7 -- selected_trade

~~~json
[
  {"caseId":"C15-E7-01","caseType":"canonical","input":"Analyze the trade explicitly selected in the trusted TraderLink context.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve one trusted typed trade selection","revalidate ownership type provenance lifecycle and current coverage server-side"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["explicit or trusted typed UI trade selection","latest complete accepted state revision","same server-authorized user workspace and Journal account","privacy-safe opaque handle resolved only server-side","current factual snapshot and provenance revision","ready_closed or legitimate_open lifecycle retained","needs_decision remains unavailable for completed-trade claims"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection identifies one authorized trade only; it supplies no raw identifier, private prose, cause, advice, mutation, or runtime capability."},
  {"caseId":"C15-E7-02","caseType":"formal_paraphrase","input":"Use the uniquely referenced typed trade selection after current account-scope and factual-coverage validation.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the unique current selected_trade binding","validate same-account ownership entity type and current factual coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed trade-selection source","accepted-state revision bound to the selection","same server-authorized account scope","server-side opaque-handle resolution","current provenance and capability state","lifecycle-specific analytical eligibility"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording cannot convert stale UI, recency, visible prose, or an opaque handle alone into identity or authorization."},
  {"caseId":"C15-E7-03","caseType":"conversational_paraphrase","input":"Can you break down the trade I have selected here?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve one trusted current-page trade selection","preserve the selected trade factual and lifecycle contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed current-page trade selection","same server-authorized account scope","server-confirmed trade type and ownership","current factual snapshot provenance and coverage","no inference from nearby page text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording does not authorize a trade guess or expose underlying execution, source, broker, or account identifiers."},
  {"caseId":"C15-E7-04","caseType":"trader_slang","input":"Break down this selected play using only its accepted facts.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["map selected play to one trusted typed selected_trade","revalidate current factual package and lifecycle eligibility"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["unique trusted typed trade selection","same server-authorized account scope","server-validated trade ownership and type","current factual coverage and limitations","accepted facts only"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Play is language only; it does not infer setup, intent, quality, outcome cause, or a recommendation."},
  {"caseId":"C15-E7-05","caseType":"abbreviation","input":"Analyze the trusted selected trd with current coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize selected trd to selected_trade only","revalidate trusted typed selection and current coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["explicit trusted typed trade selection","same server-authorized account scope","server-side entity type and ownership validation","current provenance lifecycle and coverage","no ticker expansion from abbreviation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation never supplies a ticker symbol, raw identifier, trade identity, or missing authorization."},
  {"caseId":"C15-E7-06","caseType":"misspelling","input":"Anlyze the trad currently selected in the trusted page context.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize the misspelled analyze-trade wording","resolve only the trusted typed current selection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed UI trade selection","same server-authorized account scope","server-validated ownership and entity type","current snapshot provenance lifecycle and coverage","no prose-only identity inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Spelling tolerance does not relax authorization, currentness, factual eligibility, or privacy boundaries."},
  {"caseId":"C15-E7-07","caseType":"noisy_input","input":"this selected trade... accepted facts only pls, no guesses","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the one trusted typed selected trade","limit analysis to the current approved factual package"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["unique trusted selected-trade context","same server-authorized account scope","server-side ownership type and currentness revalidation","current factual coverage and limitations","no stale UI or prose fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise is ignored without guessing identity, missing facts, explanation, advice, or access."},
  {"caseId":"C15-E7-08","caseType":"command","input":"Show the accepted entries and exits for the currently selected trade.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve one trusted typed selected trade","retrieve only authorized privacy-safe accepted execution facts"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected trade in current UI context","same server-authorized account scope","server-validated trade ownership and type","current accepted execution provenance and coverage","lifecycle status preserved","no raw execution or source identifiers in output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command is read-only and authorizes no Journal change, order action, cause claim, advice, or runtime implementation."},
  {"caseId":"C15-E7-09","caseType":"fragment","input":"the trade selected here","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve one compatible trusted typed trade selection","validate current ownership type and coverage before use"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["one trusted typed current-page trade candidate","same server-authorized account scope","accepted-state revision and selection source","server-side current factual revalidation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This fragment is resolvable only with one compatible trusted selection; otherwise it requires focused clarification."},
  {"caseId":"C15-E7-10","caseType":"follow_up","input":"What about the trade I just explicitly selected in TraderLink?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace prior selected_trade only with the newly trusted typed selection","validate complete compatible query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated newly selected trade","expectedContextRequirements":["explicit trusted typed UI selection event","latest accepted state revision","same server-authorized account scope","server-validated ownership entity type provenance and current coverage","prior selection does not win by conversational recency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit typed selection may replace a prior selection after validation; prose such as just does not establish identity."},
  {"caseId":"C15-E7-11","caseType":"correction","input":"No, use the trade currently selected in the trusted page context, not the trade from the prior accepted answer.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the prior selected_trade target with the trusted current selection","validate the full request before atomic accepted-state update"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated current selected trade","expectedContextRequirements":["explicit correction target","unique trusted typed current-page trade selection","same server-authorized account scope","server-side ownership type provenance lifecycle and coverage revalidation","prior accepted query remains unchanged until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction changes only this query selection; it does not rewrite history, mutate the trade, or learn a global alias."},
  {"caseId":"C15-E7-12","caseType":"comparison","input":"Compare the selected closed trade with the separately approved similar-trade population.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["analyze_trade","find_similar_trades"],"expectedCanonicalConcepts":["selected_trade","selected_trade_versus_similar_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected ready_closed trade","use only the separately accepted compatible peer contract","calculate the accepted comparison without causal inference"],"expectedComparison":{"left":"server-validated selected ready-closed trade","right":"approved compatible similar-trade population","basis":"separately accepted comparison metric and basis"},"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["trusted typed selected trade","same server-authorized account scope","ready_closed lifecycle eligibility for the requested closed-trade metric","approved similarity dimensions weights aggregation and peer exclusion rule","exact eligible peer counts and coverage","current provenance and fee basis from owning contracts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection does not define similarity, metric, basis, peer membership, cause, or advice."},
  {"caseId":"C15-E7-13","caseType":"ranking","input":"Place the selected closed trade in the accepted net-P-and-L ranking using the approved direction, limit, and privacy-safe tie rule.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["analyze_trade","calculate_metric"],"expectedCanonicalConcepts":["selected_trade","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["revalidate the selected ready_closed trade","apply the separately accepted metric direction positive limit and tie contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["trusted typed selected trade in same authorized account","ready_closed eligibility for selected ranking population","locked net_pnl formula currency charge allocation and fee-completeness contract","approved ranking universe direction positive integer limit and privacy-safe ties","exact population counts and current coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected status supplies no rank direction, limit, tie decision, metric basis, or raw identity."},
  {"caseId":"C15-E7-14","caseType":"negation","input":"Do not use the prior result's trade; analyze only the trade explicitly selected now.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exclude the prior accepted selected_trade referent","resolve and validate only the current trusted typed selection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated current selected trade","expectedContextRequirements":["explicit negated prior referent","one trusted typed current trade selection","same server-authorized account scope","current ownership type provenance lifecycle and coverage","no fallback to recency or prior prose"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation scopes selection only and does not delete, hide, alter, or reclassify either trade."},
  {"caseId":"C15-E7-15","caseType":"exclusion","input":"Find the approved similar-trade cohort but exclude the currently selected trade from that peer set.","expectedPrimaryIntent":"find_similar_trades","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":["validated exclusion of the selected trade from the peer population"],"expectedGroupings":[],"expectedOperators":["resolve the selected trade as the exclusion target","validate the separate compatible peer population and exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected trade in same authorized account","current ownership type provenance lifecycle and coverage","approved peer-population and similarity contract","privacy-safe exclusion without exposing raw identifiers","exact eligible excluded and unavailable peer counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion applies to the peer population; it neither changes selected-trade identity nor mutates Journal facts."},
  {"caseId":"C15-E7-16","caseType":"multi_filter","input":"For the selected trade, find authorized same-ticker long peers under five dollars during the validated June period.","expectedPrimaryIntent":"find_similar_trades","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":["validated same-ticker predicate","validated long-side predicate","validated under-five-dollar predicate"],"expectedGroupings":[],"expectedOperators":["resolve the trusted selected trade","apply the owner-validated peer predicate tree with explicit precedence"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected trade in same authorized account","server-validated selected trade ticker and lifecycle facts","Category 12 predicate contract","Category 13 June range contract","approved peer eligibility and similarity contract","exact eligible excluded partial and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters shape a separate authorized peer set and do not redefine, expose, or infer the selected trade."},
  {"caseId":"C15-E7-17","caseType":"multi_part","input":"Analyze the selected trade, state whether the accepted facts show it is closed or still open, and report only its supported privacy-safe facts and coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade","preserve exact lifecycle state","report only supported facts and coverage limitations"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected trade","same server-authorized account scope","server-confirmed entity type ownership and current provenance","ready_closed legitimate_open or needs_decision lifecycle state","metric-specific eligibility and current coverage","privacy-safe bounded evidence only"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A needs_decision trade remains unavailable for completed-trade claims; the answer cannot infer closure, cause, advice, or a corrective action."},
  {"caseId":"C15-E7-18","caseType":"ambiguous","input":"Analyze it.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no unique compatible trusted typed trade referent","same server-authorized account scope","pending ambiguity tied to unchanged accepted revision","no selected value supplied by recency prose or page visibility"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the trade currently selected in TraderLink?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the selected object first; later metric, period, or basis questions remain staged and no selection is applied while ambiguity remains."},
  {"caseId":"C15-E7-19","caseType":"negative_example","input":"Analyze my latest trade from the validated current period.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat the request as a new temporal retrieval and trade-analysis question","do not map latest trade to selected_trade"],"expectedComparison":null,"expectedTimeRange":"validated current-period temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["Category 13 temporal meaning","same server-authorized account scope","authorized deterministic latest-trade selection rule","unique eligible result or focused clarification","current lifecycle and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Latest is a new retrieval criterion, not evidence that a trade is selected; no recency guess or raw identifier is allowed."},
  {"caseId":"C15-E7-20","caseType":"unsupported_data","input":"Use a stale page selection and another account's raw trade reference to reconstruct the selected trade.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject stale cross-account raw-reference selection reconstruction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["current trusted typed selection required","current server ownership and type revalidation required","same authorized account binding required","current provenance lifecycle and coverage required","no raw-reference stale-page or cross-account fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Stale UI state and another account's raw trade reference cannot establish an authorized current selected trade or its factual coverage.","notes":"Fail closed without echoing identifiers, reconstructing private data, crossing account scope, or claiming runtime access."},
  {"caseId":"C15-E7-21","caseType":"selected_entity_context","input":"For the trusted selected ticker, analyze the uniquely compatible trade separately selected in the same current account context.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_trade","selected_ticker"],"expectedFilters":["validated selected-ticker compatibility constraint"],"expectedGroupings":[],"expectedOperators":["resolve both typed selections independently","revalidate that the selected trade matches the exact selected ticker","retain the selected trade as the analyzed entity"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade and exact selected ticker","expectedContextRequirements":["trusted typed trade and ticker selections","same server-authorized account scope for both","server-validated ownership types and current provenance","exact ticker preservation","unique compatibility without inferred linkage","selected-trade lifecycle and current coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Two typed selections remain distinct; ticker context cannot manufacture a trade selection or expose an underlying identifier."},
  {"caseId":"C15-E7-22","caseType":"cross_category","input":"For the selected closed trade, calculate fee-complete net P and L and explain the accepted calculation without changing any Journal fact.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade","explain_result"],"expectedCanonicalConcepts":["selected_trade","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected ready_closed trade","apply the locked net_pnl formula and coverage contract","explain the accepted result without mutation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["trusted typed selected trade in same authorized account","ready_closed lifecycle eligibility","locked net_pnl gross P and L minus allocated charge_cost plus allocated charge_credit formula","recorded-currency and fee-completeness contract","current factual provenance and exact coverage","Category 18 explanation presentation only"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Category 15 supplies selection only; metric truth, lifecycle, coverage, presentation, privacy, and write protection remain with their owners."}
]
~~~

## Evaluation Array C15-E8 -- selected_ticker

~~~json
[
  {"caseId":"C15-E8-01","caseType":"canonical","input":"Show my accepted results for the ticker explicitly selected in the trusted TraderLink context.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker equality predicate"],"expectedGroupings":[],"expectedOperators":["resolve one explicit or trusted typed ticker selection","preserve the exact ticker token and revalidate current authorized coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["explicit or trusted typed UI ticker selection","latest accepted-state revision","same server-authorized user workspace and Journal account","exact normalized ticker token","current factual provenance capability and coverage","no inference from a nearby trade or prose"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection carries one exact authorized ticker only; it supplies no raw security identifier, metric, basis, cause, advice, mutation, or runtime."},
  {"caseId":"C15-E8-02","caseType":"formal_paraphrase","input":"Use the uniquely referenced typed ticker selection after exact-symbol, account-scope, and coverage validation.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["retain one trusted selected_ticker binding","revalidate exact symbol authorization provenance and current coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed ticker-selection source","accepted-state revision bound to the selection","same server-authorized account scope","exact normalized ticker token without correction","current field availability and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording cannot convert a similar-looking symbol, stale UI, visible prose, or raw instrument reference into an authorized ticker."},
  {"caseId":"C15-E8-03","caseType":"conversational_paraphrase","input":"How did I do on the ticker I have selected here?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["resolve the trusted current-page ticker selection","query only the authorized exact ticker population"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["one trusted typed current-page ticker selection","same server-authorized account scope","server-validated exact symbol and selection source","current provenance lifecycle coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording does not infer a ticker from the last trade, prior answer, market popularity, or browser visibility."},
  {"caseId":"C15-E8-04","caseType":"trader_slang","input":"Show my accepted history on this selected name.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["map selected name to one trusted typed selected_ticker","retrieve only authorized facts for the exact ticker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["unique trusted typed ticker selection","same server-authorized account scope","exact ticker token and authorized factual scope","current provenance coverage and lifecycle visibility"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Name is trader language only; it does not broaden symbol matching, define security identity, or imply recommendation."},
  {"caseId":"C15-E8-05","caseType":"abbreviation","input":"Use the trusted selected tkr exactly as shown by the typed selection.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["normalize selected tkr to selected_ticker only","preserve and revalidate the exact ticker token"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed ticker selection","same server-authorized account scope","exact normalized ticker token","current provenance capability and coverage","no symbol expansion correction or guessing"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation labels the state field; it never abbreviates, expands, or changes the actual ticker symbol."},
  {"caseId":"C15-E8-06","caseType":"misspelling","input":"Use the seleced tickr from the trusted current page.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["normalize the misspelled selected-ticker wording","resolve only one trusted typed exact ticker selection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed UI ticker selection","same server-authorized account scope","server-validated exact ticker token and selection source","current provenance field availability and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Spelling tolerance applies to the request wording, never to the exact ticker token or authorization."},
  {"caseId":"C15-E8-07","caseType":"noisy_input","input":"this selected ticker... june accepted stats only pls","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["resolve one trusted typed selected ticker","apply the separately validated June time range"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["unique trusted selected-ticker context","same server-authorized account scope","exact ticker token preserved","Category 13 June range contract","current population provenance and coverage","no prose or stale-selection fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not justify guessing the symbol, range, missing facts, metric, or account."},
  {"caseId":"C15-E8-08","caseType":"command","input":"Retrieve my accepted trades for the exact ticker currently selected.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the trusted selected ticker","retrieve only authorized accepted trade records for that exact ticker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed current ticker selection","same server-authorized account scope","exact normalized ticker token","authorized accepted trade population","current lifecycle coverage including legitimate_open and needs_decision visibility","no raw security or trade identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command is read-only and does not authorize edits, orders, advice, causal conclusions, or runtime implementation."},
  {"caseId":"C15-E8-09","caseType":"fragment","input":"the ticker selected here","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["resolve one compatible trusted typed ticker selection","validate exact symbol and current account scope before use"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["one trusted typed current-page ticker candidate","same server-authorized account scope","accepted-state revision and selection source","exact ticker preservation","current factual coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This fragment resolves only with one compatible trusted selection; otherwise the system asks which ticker and supplies no value."},
  {"caseId":"C15-E8-10","caseType":"follow_up","input":"What about the ticker I just explicitly selected in TraderLink?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact newly selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["replace the prior selected_ticker only with the new trusted typed selection","validate the complete compatible request before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact newly selected ticker","expectedContextRequirements":["explicit trusted typed UI ticker-selection event","latest accepted state revision","same server-authorized account scope","exact symbol ownership provenance and current coverage revalidation","prior symbol does not win by conversational recency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The typed event may replace prior selection after validation; just is not an identity or currentness proof."},
  {"caseId":"C15-E8-11","caseType":"correction","input":"No, use the exact ticker currently selected, not the ticker mentioned in the prior answer.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact current selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["replace the prior selected_ticker target with the trusted current selection","validate exact symbol and full request before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact current selected ticker","expectedContextRequirements":["explicit correction target","one trusted typed current-page ticker selection","same server-authorized account scope","exact ticker preservation","current provenance capability and coverage","prior accepted query unchanged until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction changes this query only; it does not rename a symbol, learn an alias, or mutate stored facts."},
  {"caseId":"C15-E8-12","caseType":"comparison","input":"Compare the exact selected ticker with the separately validated all-other-tickers cohort.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["summarize_performance"],"expectedCanonicalConcepts":["selected_ticker","one_ticker_versus_all_other_tickers"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the exact selected ticker","construct only the separately approved authorized complement","apply the accepted metric basis populations and equality contract"],"expectedComparison":{"left":"server-validated exact selected ticker population","right":"approved authorized all-other-tickers complement","basis":"separately accepted comparison metric and basis"},"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed selected ticker in same authorized account","exact ticker token preserved","approved universe and complement exclusion rule","separate compatible left and right populations","accepted metric fee currency and lifecycle contract","exact side counts coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection does not silently create the complement, comparison metric, basis, cause, or recommendation."},
  {"caseId":"C15-E8-13","caseType":"ranking","input":"Rank the exact selected ticker within the approved universe by fee-complete net P and L using the accepted direction, limit, and privacy-safe ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["selected_ticker","net_pnl"],"expectedFilters":[],"expectedGroupings":["authorized exact ticker groups"],"expectedOperators":["resolve and revalidate the selected ticker","apply the accepted metric universe direction positive limit and tie contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed selected ticker in same authorized account","exact ticker token preserved","locked net_pnl formula currency charge allocation and fee-completeness contract","approved eligible ticker universe direction positive integer limit and privacy-safe ties","per-ticker counts and current coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected status supplies no ranking universe, direction, limit, tie outcome, metric basis, or raw security identity."},
  {"caseId":"C15-E8-14","caseType":"negation","input":"Do not use the prior answer's ticker; use only the exact ticker explicitly selected now.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact current selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["exclude the prior ticker referent","resolve and validate only the current trusted typed exact ticker selection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact current selected ticker","expectedContextRequirements":["explicit negated prior referent","one trusted typed current ticker selection","same server-authorized account scope","exact ticker preservation","current provenance field availability and coverage","no prior-prose fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation scopes the query selection and does not hide records, change symbol identity, or alter the account."},
  {"caseId":"C15-E8-15","caseType":"exclusion","input":"Show authorized ticker results except for the exact ticker currently selected.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exclusion of the exact selected ticker"],"expectedGroupings":["authorized exact ticker groups"],"expectedOperators":["resolve the selected ticker as the exclusion operand","apply the exclusion only to a separately authorized ticker universe"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed selected ticker","same server-authorized account scope","exact ticker token preserved","separately authorized universe and complement rule","exact eligible excluded missing and unavailable counts","current coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion shapes a result population; it does not delete the ticker, suppress unrelated facts, or broaden account scope."},
  {"caseId":"C15-E8-16","caseType":"multi_filter","input":"For the exact selected ticker, show long trades under five dollars outside premarket in the validated June period.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate","validated long-side predicate","validated under-five-dollar predicate","validated outside-premarket predicate"],"expectedGroupings":[],"expectedOperators":["resolve the trusted selected ticker","apply the owner-validated predicate tree with explicit precedence"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed selected ticker in same authorized account","exact ticker token preserved","Category 12 predicate contract","Category 13 June range contract","authorized trade population and lifecycle coverage","exact covered excluded and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters constrain records without changing the selected ticker, inventing missing values, or making an advisory claim."},
  {"caseId":"C15-E8-17","caseType":"multi_part","input":"For the selected ticker, show the validated June results, confirmed open-position coverage, and exact unavailable or unresolved counts.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected ticker","apply the validated June range","report lifecycle-specific coverage without reclassification"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed selected ticker","same server-authorized account scope","exact ticker preservation","Category 13 June contract","ready_closed legitimate_open and needs_decision coverage","exact eligible partial excluded and unavailable counts","current provenance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection never hides open or decision-incomplete facts and cannot infer closure, performance cause, or action."},
  {"caseId":"C15-E8-18","caseType":"ambiguous","input":"Show me this ticker.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no unique compatible explicit or trusted typed ticker candidate","same server-authorized account scope","pending ambiguity tied to unchanged accepted revision","no ticker value supplied by prose nearby trade or stale UI"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which ticker do you mean?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the ticker first; later period, metric, or grouping questions stay staged and no symbol is guessed or corrected."},
  {"caseId":"C15-E8-19","caseType":"negative_example","input":"Which ticker had the highest fee-complete net P and L during the validated current month?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["most_profitable","net_pnl"],"expectedFilters":[],"expectedGroupings":["authorized exact ticker groups"],"expectedOperators":["treat the message as a new ranking question","apply the explicit fee-complete net_pnl metric and approved universe direction and ties","do not map the result target to selected_ticker"],"expectedComparison":null,"expectedTimeRange":"validated current-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["Category 13 current-month contract","same server-authorized account scope","authorized ticker universe","locked net_pnl formula currency charge allocation and fee-completeness contract","descending direction positive result limit and privacy-safe ties","per-group counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A ranking target is not an existing ticker selection and must not inherit one from page or conversation context."},
  {"caseId":"C15-E8-20","caseType":"unsupported_data","input":"Infer the selected ticker from a stale trade card, a partial symbol, and another account's raw instrument reference.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_ticker"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject stale partial cross-account raw-reference ticker inference"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current exact explicit or trusted typed ticker required","current server authorization and account binding required","exact-symbol validation required","current provenance and coverage required","no stale-trade partial-symbol raw-reference or cross-account fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A stale trade card, partial symbol, and another account's raw instrument reference cannot establish one exact authorized current selected ticker.","notes":"Fail closed without echoing raw references, completing the symbol, crossing account scope, or claiming runtime access."},
  {"caseId":"C15-E8-21","caseType":"selected_entity_context","input":"For the trusted selected trade, retain its exact ticker only when the same-account typed trade facts uniquely validate that ticker.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["selected_trade","selected_ticker"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["resolve the trusted selected trade first","derive selected_ticker only from server-validated typed trade facts","preserve the exact ticker token"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade and exact validated ticker","expectedContextRequirements":["trusted typed selected trade","same server-authorized account scope","current trade ownership type provenance and coverage","one exact ticker fact in the approved package","explicit owner contract permitting the typed derivation","no inference from prose or stale card text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Typed factual derivation is distinct from guessing a ticker from visible prose; ambiguous or absent ticker facts require a new question or clarification."},
  {"caseId":"C15-E8-22","caseType":"cross_category","input":"For the exact selected ticker, calculate fee-complete net P and L over the validated prior month and present the supported result as a table.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["summarize_performance"],"expectedCanonicalConcepts":["selected_ticker","net_pnl"],"expectedFilters":["validated exact selected-ticker predicate"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected ticker","apply the validated prior-month range and locked net_pnl contract","apply table presentation without changing analytical truth"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":"server-validated exact selected ticker","expectedContextRequirements":["trusted typed selected ticker in same authorized account","exact ticker preservation","Category 13 prior-month contract","locked net_pnl gross P and L minus allocated charge_cost plus allocated charge_credit formula","recorded-currency fee-completeness lifecycle and coverage contract","Category 18 table response mode"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection, time, metric, fee basis, lifecycle, and presentation remain separate owner-validated fields with no mutation or advice."}
]
~~~

## Evaluation Array C15-E9 -- selected_journal_entry

~~~json
[
  {"caseId":"C15-E9-01","caseType":"canonical","input":"Explain the privacy-safe accepted facts linked to the Journal entry explicitly selected in trusted TraderLink context.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve one trusted typed Journal-entry selection","revalidate ownership type provenance content boundary and current coverage server-side"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["explicit or trusted typed UI Journal-entry selection","latest accepted-state revision","same server-authorized user workspace and Journal account","privacy-safe opaque handle resolved only server-side","permitted entry type and date metadata only","minimum approved factual package and current coverage","no copied private entry content"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection identifies one authorized Journal object only; it supplies no raw identifier, private text, mutation, cause, advice, or runtime capability."},
  {"caseId":"C15-E9-02","caseType":"formal_paraphrase","input":"Use the uniquely referenced typed Journal-entry selection after current ownership, entity-type, content-boundary, and coverage validation.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain one trusted selected_journal_entry binding","validate same-account ownership type provenance and approved factual package"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed Journal-entry selection source","accepted-state revision bound to the selection","same server-authorized account scope","server-side opaque-handle resolution","current provenance capability and coverage","no raw content in selection state or operational output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording cannot make stale UI, transcript prose, copied text, or an opaque handle alone establish entry identity or authorization."},
  {"caseId":"C15-E9-03","caseType":"conversational_paraphrase","input":"What accepted facts are connected to the Journal entry I have selected here?","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve one trusted current-page Journal-entry selection","retrieve only privacy-safe authorized linked facts"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed current-page Journal-entry selection","same server-authorized account scope","server-confirmed ownership entity type and selection source","current provenance linkage coverage and limitations","minimum approved content package only"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording does not authorize copied note text, inferred linkage, a nearby object, or a Journal write."},
  {"caseId":"C15-E9-04","caseType":"trader_slang","input":"Help me review the selected journal note using only its approved factual package.","expectedPrimaryIntent":"assist_daily_review","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["map selected journal note to one trusted typed selected_journal_entry","limit review to the approved privacy-safe factual package"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["unique trusted typed Journal-entry selection","same server-authorized account scope","server-validated entry ownership and type","permitted metadata and current linked-fact coverage","no raw private note content"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Note is conversational language only; the request neither reads unrestricted prose nor infers intent, cause, advice, or permission to edit."},
  {"caseId":"C15-E9-05","caseType":"abbreviation","input":"Review the trusted selected jrnl entry through its privacy-safe factual package.","expectedPrimaryIntent":"assist_daily_review","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize selected jrnl entry to selected_journal_entry only","revalidate the typed selection and approved content boundary"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed Journal-entry selection","same server-authorized account scope","server-side ownership type and provenance validation","current coverage and minimum approved factual package","no raw entry identifier or text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation labels the selected object only and never becomes an identifier or authorization shortcut."},
  {"caseId":"C15-E9-06","caseType":"misspelling","input":"Explain the accepted facts for this seleced jounral enty.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize the misspelled selected-entry wording","resolve only one trusted typed current selection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed UI Journal-entry selection","same server-authorized account scope","server-validated ownership type provenance and current coverage","minimum approved factual package only","no prose-only identity inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Spelling tolerance does not relax authorization, privacy, content minimization, currentness, or factual support."},
  {"caseId":"C15-E9-07","caseType":"noisy_input","input":"this selected journal entry... approved facts only, dont copy the private text","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve one trusted typed selected Journal entry","limit output to the approved privacy-safe factual package"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["unique trusted Journal-entry selection","same server-authorized account scope","server-side ownership type and currentness revalidation","current linked-fact coverage and limitations","private entry text excluded"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not justify exposing text, guessing identity or linkage, or creating an explanation beyond accepted facts."},
  {"caseId":"C15-E9-08","caseType":"command","input":"Show the privacy-safe accepted facts linked to the currently selected Journal entry without editing it.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the trusted selected Journal entry","retrieve only authorized privacy-safe linked facts","preserve read-only operation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed current Journal-entry selection","same server-authorized account scope","server-validated entry ownership type and provenance","current linkage and coverage","minimum approved content package","no raw content or identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command explicitly remains read-only and authorizes no note, tag, review, Journal, or trade mutation."},
  {"caseId":"C15-E9-09","caseType":"fragment","input":"the Journal entry selected here","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve one compatible trusted typed Journal-entry selection","validate current ownership type content boundary and coverage before use"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["one trusted typed current-page Journal-entry candidate","same server-authorized account scope","accepted-state revision and selection source","server-side current provenance and coverage revalidation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment resolves only with one compatible trusted selection; otherwise it asks a focused question and supplies no entry value."},
  {"caseId":"C15-E9-10","caseType":"follow_up","input":"What about the Journal entry I just explicitly selected in TraderLink?","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace prior selected_journal_entry only with the new trusted typed selection","validate the complete compatible request before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated newly selected Journal entry","expectedContextRequirements":["explicit trusted typed UI Journal-entry selection event","latest accepted-state revision","same server-authorized account scope","server-validated ownership type provenance and current coverage","approved content boundary","prior entry does not win by recency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The typed event may replace prior selection after validation; just and visible prose are not identity proof."},
  {"caseId":"C15-E9-11","caseType":"correction","input":"No, I mean the Journal entry currently selected, not the earlier accepted review.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the prior entry referent with the trusted current selection","validate the full request before atomic accepted-state update"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated current selected Journal entry","expectedContextRequirements":["explicit correction target","unique trusted typed current-page Journal-entry selection","same server-authorized account scope","server-side ownership type provenance content-boundary and coverage revalidation","prior accepted query unchanged until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction changes this query selection only and cannot edit the entry, rewrite the prior review, or learn a global alias."},
  {"caseId":"C15-E9-12","caseType":"comparison","input":"Compare the validated current period referenced by the selected Journal entry with the separately resolved previous period using the accepted metric and basis.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["selected_journal_entry","current_versus_previous"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected Journal entry","derive the current-period reference only from permitted typed metadata or authorized linked facts","resolve the previous period separately through Category 13","validate compatible side populations metric basis fees currency and coverage","calculate the declared signed current-minus-previous difference and absolute magnitude","apply fixed equality semantics","do not calculate a percentage without a separately explicit compatible meaningful nonzero baseline"],"expectedComparison":{"left":"Category 13-resolved validated current period referenced by the authorized selected Journal entry","right":"separately Category 13-resolved previous period","basis":"separately accepted compatible comparison metric basis fees and currency contract"},"expectedTimeRange":"Category 13-resolved current and previous temporal contracts with declared event basis timezone and endpoints","expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed selected Journal entry in same authorized account","current provenance and approved linked-fact package","permitted typed date or period linkage without private prose","Category 13 current-period and previous-period event basis timezone and endpoint contracts","separate compatible current and previous populations","accepted metric basis fee currency and lifecycle contract","exact eligible covered excluded partial and unavailable side counts","side-specific coverage and limitations","fixed equality and no implicit percentage baseline","no causal interpretation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The selected entry supplies only a trusted current-period reference; it does not define the previous side from prose, alter the accepted metric, or prove that the period difference has a cause."},
  {"caseId":"C15-E9-13","caseType":"ranking","input":"Rank an authorized trade linked to the selected Journal entry only after validating the linkage, metric, universe, direction, limit, and privacy-safe ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected Journal entry","validate one privacy-safe typed trade linkage separately","apply the separately accepted ranking contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry and authorized linked trade","expectedContextRequirements":["trusted typed selected Journal entry in same authorized account","current entry provenance and approved linkage coverage","one server-validated typed trade linkage","linked-trade lifecycle eligibility","accepted metric basis eligible universe direction positive integer limit and privacy-safe ties","exact counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Entry selection supplies no hidden trade, metric, universe, direction, limit, tie outcome, cause, or advice."},
  {"caseId":"C15-E9-14","caseType":"negation","input":"Do not edit or quote the selected Journal entry; explain only its supported privacy-safe linked facts.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected Journal entry","exclude raw private content from context and output","preserve read-only explanation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed selected Journal entry","same server-authorized account scope","server-validated ownership type and current provenance","minimum approved factual package and coverage","private text and write operations excluded"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation reinforces privacy and read-only scope; it does not alter the entry or authorize unrestricted content access."},
  {"caseId":"C15-E9-15","caseType":"exclusion","input":"Show authorized facts linked to the selected Journal entry while excluding any trade without verified typed linkage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":["validated exclusion of facts without verified typed linkage"],"expectedGroupings":[],"expectedOperators":["resolve the trusted selected Journal entry","include only server-validated privacy-safe linked facts","report excluded and unavailable linkage counts"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed selected Journal entry in same authorized account","current entry provenance type and coverage","approved typed linkage contract","privacy-safe fact package","exact linked excluded partial and unavailable counts","no prose-based linkage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The exclusion operates on linked-fact retrieval and neither changes the entry nor treats private prose as evidence."},
  {"caseId":"C15-E9-16","caseType":"multi_filter","input":"For the selected Journal entry, show verified linked June trades under five dollars outside premarket.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":["validated verified-linkage predicate","validated under-five-dollar predicate","validated outside-premarket predicate"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected Journal entry","apply the owner-validated linked-trade predicate tree"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed selected Journal entry in same authorized account","current entry provenance type and approved linkage coverage","Category 12 predicate contract","Category 13 June range contract","authorized linked-trade population and lifecycle coverage","no private-prose matching"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters constrain separately authorized linked facts and do not redefine the entry or infer links from its text."},
  {"caseId":"C15-E9-17","caseType":"multi_part","input":"Identify the selected Journal entry type, state its permitted date metadata, and summarize only its privacy-safe supported link coverage.","expectedPrimaryIntent":"inspect_data_quality","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected Journal entry","return only permitted typed metadata","report current linkage coverage and limitations"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed selected Journal entry","same server-authorized account scope","server-validated entry ownership type and provenance","permitted date metadata only","minimum approved factual package","exact linked partial excluded and unavailable counts","private content excluded"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Structured metadata and coverage can be described without copying entry text, inferring a trade, or changing Journal state."},
  {"caseId":"C15-E9-18","caseType":"ambiguous","input":"Explain this entry.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no unique compatible trusted typed Journal-entry referent","same server-authorized account scope","pending ambiguity tied to unchanged accepted revision","no entry value or content supplied by prose recency or stale UI"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the Journal entry currently selected in TraderLink?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the selected entry first; later linkage or detail questions stay staged and no content is read while ambiguity remains."},
  {"caseId":"C15-E9-19","caseType":"negative_example","input":"Show my authorized Journal entries for today's validated trading date.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat the message as a new account-scoped Journal retrieval question","do not map it to selected_journal_entry"],"expectedComparison":null,"expectedTimeRange":"validated trading-date contract","expectedSelectedEntity":null,"expectedContextRequirements":["Category 13 trading-date contract","same server-authorized account scope","authorized Journal-entry retrieval population","privacy-safe result handles and coverage","no existing selected entry inferred"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A dated retrieval request is not selected-entry context and exposes no raw identifiers or private Journal text."},
  {"caseId":"C15-E9-20","caseType":"unsupported_data","input":"Reconstruct the selected Journal entry from stale page prose, copied private text, and another account's raw reference.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject stale private-text cross-account raw-reference entry reconstruction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["current trusted typed Journal-entry selection required","current server ownership type and account revalidation required","current provenance content boundary and coverage required","no stale-prose copied-text raw-reference or cross-account fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Stale page prose, copied private content, and another account's raw reference cannot establish an authorized current selected Journal entry.","notes":"Fail closed without echoing private text or identifiers, crossing account scope, reconstructing the object, or claiming runtime access."},
  {"caseId":"C15-E9-21","caseType":"selected_entity_context","input":"For the trusted selected trade, use a Journal entry only when a unique same-account typed linkage is separately validated.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["selected_trade","selected_journal_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the selected trade independently","derive selected_journal_entry only from one server-validated typed linkage","revalidate both entities and current coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade and uniquely linked Journal entry","expectedContextRequirements":["trusted typed selected trade","same server-authorized account scope for both entities","current trade and entry ownership type provenance and coverage","one approved typed linkage","minimum approved Journal factual package","no linkage inferred from note prose or recency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Two selected-object types remain distinct; absent or non-unique linkage requires a focused question or a new query, never inference."},
  {"caseId":"C15-E9-22","caseType":"cross_category","input":"For the selected Journal entry, explain the validated prior-month trade summary using only authorized linked facts and a concise response.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["summarize_performance"],"expectedCanonicalConcepts":["selected_journal_entry"],"expectedFilters":["validated verified-linkage predicate"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected Journal entry","apply the validated prior-month range to authorized linked facts","apply concise presentation without changing analytical truth"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":"server-validated selected Journal entry","expectedContextRequirements":["trusted typed selected Journal entry in same authorized account","current entry ownership type provenance and approved linkage coverage","Category 13 prior-month contract","locked linked-trade metric population lifecycle and coverage contract","Category 18 concise response mode","minimum approved factual package with no private text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection, linkage, time, analytics, presentation, privacy, and write protection remain separate owner-validated contracts."}
]
~~~

## Evaluation Array C15-E10 -- current_account

~~~json
[
  {"caseId":"C15-E10-01","caseType":"canonical","input":"Summarize performance only within the account scope already authorized for this conversation.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","execute only against that single Journal account after revalidation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authenticated Platform user","server-authorized workspace and Journal account bound to this conversation","current authorization revalidation","one account only","no user-supplied scope value"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The conversation scope is server-owned; the message does not select, rename, transfer, or broaden an account."},
  {"caseId":"C15-E10-02","caseType":"formal_paraphrase","input":"Constrain the retrieval to the single Journal account established by the authenticated conversation context.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","revalidate authorization before retrieval"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authenticated Platform user","server-owned workspace and Journal-account binding","current authorization","single-account factual snapshot","no client-provided account locator"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal language cannot turn account scope into a user-editable query field."},
  {"caseId":"C15-E10-03","caseType":"conversational_paraphrase","input":"Keep this conversation on the account it was opened for and show my covered trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","retrieve only authorized covered trades"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authenticated Platform user","server-bound workspace and Journal account","current authorization and coverage","single-account result set","no scope inferred from pronouns"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording may refer to the existing boundary but cannot establish it."},
  {"caseId":"C15-E10-04","caseType":"trader_slang","input":"Run the stats in this chat's authorized book only.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","calculate only within one revalidated Journal account"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authenticated Platform user","server-bound workspace and Journal account","current authorization","approved metric population and coverage","book is language only and supplies no account value"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang never authorizes an account, credentials, or cross-account aggregation."},
  {"caseId":"C15-E10-05","caseType":"abbreviation","input":"Use only the acct scope already authorized for this convo.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","revalidate scope before query execution"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authenticated Platform user","server-bound workspace and Journal account","current authorization","single-account query","abbreviations supply no identifier or permission"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviations normalize only as language and never become scope credentials."},
  {"caseId":"C15-E10-06","caseType":"misspelling","input":"Stay in the curent authorized acount for this conversation.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","revalidate the bound Journal account"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authenticated Platform user","server-bound workspace and Journal account","current authorization","no scope reconstructed from misspelled prose"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Misspelling tolerance does not weaken authorization or account isolation."},
  {"caseId":"C15-E10-07","caseType":"noisy_input","input":"same chat account pls... just the authorized one, no mixing","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","exclude every other account by construction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authenticated Platform user","server-bound workspace and Journal account","current authorization","single-account factual snapshot","noise supplies no account selector"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise cannot create a union, switch, or fallback account."},
  {"caseId":"C15-E10-08","caseType":"command","input":"Revalidate this conversation's authorized Journal account and retrieve only its covered records.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","revalidate authorization","retrieve only covered records in that account"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authenticated Platform user","server-bound workspace and Journal account","current authorization","record-level ownership and coverage","no message-controlled account value"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Imperative form does not grant broader access or authorize a scope change."},
  {"caseId":"C15-E10-09","caseType":"fragment","input":"this conversation's authorized account only","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique compatible accepted query","authenticated Platform user","server-bound workspace and Journal account","current authorization","fragment supplies no new scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment may constrain a uniquely accepted request only to its existing server-owned account boundary."},
  {"caseId":"C15-E10-10","caseType":"follow_up","input":"For that accepted summary, keep the same authorized conversation scope and change only the validated period.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account","active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","replace only the validated temporal field","validate full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"validated replacement temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-bound workspace and Journal account","current authorization","Category 13-resolved period","unchanged metric population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A follow-up may change an owned query field but never transfer its accepted state to another account."},
  {"caseId":"C15-E10-11","caseType":"correction","input":"No, keep this conversation in its authorized account; I was correcting only the ticker filter.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account","active_filters"],"expectedFilters":["validated corrected ticker filter"],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","replace only the validated filter field","leave rejected attempt outside accepted state"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-bound workspace and Journal account","current authorization","server-authorized ticker operand","atomic full-query acceptance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A correction cannot reinterpret an account label or user prose as authorization."},
  {"caseId":"C15-E10-12","caseType":"comparison","input":"Compare the accepted two groups only inside this conversation's authorized Journal account.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account","active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","preserve validated comparison sides","calculate within one account only"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-bound workspace and Journal account","current authorization","compatible side populations in one account","locked metric and basis","exact counts and coverage","no cross-account side"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A comparison cannot use another account as a side or silently union private histories."},
  {"caseId":"C15-E10-13","caseType":"ranking","input":"Rank the authorized ticker groups from this conversation's account without bringing in any other account.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain immutable server-authorized conversation scope","apply validated ranking metric sort limit and privacy-safe tie contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-bound workspace and Journal account","current authorization","Category 14 ranking contract","positive finite result limit","exact sample counts and coverage","single-account groups only"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking language never authorizes cross-account candidates or reveals identifiers in ties."},
  {"caseId":"C15-E10-14","caseType":"negation","input":"Do not switch accounts; remove only the validated premarket filter from the accepted query.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account","active_filters"],"expectedFilters":["accepted filters with validated premarket predicate removed"],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","remove only the validated filter predicate"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same server-bound workspace and Journal account","current authorization","Category 12-valid filter removal","unchanged metric and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation confirms the invariant boundary and scopes only the explicit filter delta."},
  {"caseId":"C15-E10-15","caseType":"exclusion","input":"Exclude short trades from the accepted summary while staying in this conversation's authorized account.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account","active_filters"],"expectedFilters":["validated short-side exclusion"],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","add only the validated exclusion predicate"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-bound workspace and Journal account","current authorization","Category 12 predicate validation","compatible population and coverage","no account exclusion list inferred from prose"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion is a query predicate inside one account, not a mechanism for selecting accounts."},
  {"caseId":"C15-E10-16","caseType":"multi_filter","input":"Within this conversation's authorized account, apply the validated long-side, under-five-dollar, and morning-session filters.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account","active_filters"],"expectedFilters":["validated long-side filter","validated under-five-dollar filter","validated morning-session filter"],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","apply validated predicate tree with explicit precedence"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-bound workspace and Journal account","current authorization","Category 12 field operator operand validation","compatible eligible population","exact coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple filters remain account-internal and cannot accumulate multiple account scopes."},
  {"caseId":"C15-E10-17","caseType":"multi_part","input":"Use this conversation's authorized account, group the accepted summary by ticker, and present the unchanged facts in a table.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["current_account","response_detail_level"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain immutable server-authorized conversation scope","add validated grouping","apply table presentation without changing truth"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-bound workspace and Journal account","current authorization","Category 11 ticker grouping","Category 18 table response mode","unchanged metric population factual snapshot and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each owned field is validated separately while account scope remains immutable."},
  {"caseId":"C15-E10-18","caseType":"ambiguous","input":"Use that other account view for this accepted summary.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["leave accepted query revision unchanged","do not switch transfer union or broaden account scope","require a new normally selected account-scoped conversation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["current conversation remains bound to its server-authorized account","no trusted account selection in message prose","normal account selector is outside this conversation flow","pending ambiguity supplies no account value"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want to start a new conversation from the normally selected account?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one focused workflow question; never ask for an account ID, label, credential, or private identifying detail."},
  {"caseId":"C15-E10-19","caseType":"negative_example","input":"How do I normally select another account before starting a separate conversation?","expectedPrimaryIntent":"product_help","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat as a new product-help question","do not map to current_account or mutate this conversation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["normal authenticated account-selection help","this conversation remains in its server-bound scope","no account existence label identifier credential or private history disclosed","new selected scope requires a new conversation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A workflow-help question is not account context and never switches the current conversation."},
  {"caseId":"C15-E10-20","caseType":"unsupported_data","input":"Combine every account I might have into this conversation and use their private history as one result.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account union","leave accepted and pending state unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized conversation scope","single Journal account only","no discovery of other accounts","no raw identifiers labels credentials or private history"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A conversation cannot switch, discover, union, or access another account; select an authorized account normally and start a new scoped conversation.","notes":"Fail closed without confirming whether any other account exists."},
  {"caseId":"C15-E10-21","caseType":"selected_entity_context","input":"Analyze the trusted selected trade only if it still belongs to this conversation's authorized Journal account.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account","selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","resolve selected trade independently","revalidate entity ownership type provenance and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade in the bound Journal account","expectedContextRequirements":["trusted typed selected trade","same server-bound workspace and Journal account","current authorization","current entity ownership type provenance lifecycle and coverage","no raw identifier or cross-account fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A selected entity is usable only after independent same-account validation; selection cannot move the conversation."},
  {"caseId":"C15-E10-22","caseType":"cross_category","input":"For the prior month, summarize net P and L in this conversation's authorized account and keep exact coverage visible.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["current_account","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain immutable server-authorized conversation scope","apply exact net P and L contract","preserve exact sample and coverage reporting"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-bound workspace and Journal account","current authorization","Category 13 prior-month temporal contract","net P and L equals gross P and L minus allocated charge cost plus allocated charge credit","compatible recorded currency and fee completeness","exact eligible counts and partial or unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Account authorization, time, metric basis, charges, currency, and coverage remain separate locked-owner contracts."}
]
~~~

## Evaluation Array C15-E11 -- response_detail_level

~~~json
[
  {"caseId":"C15-E11-01","caseType":"canonical","input":"Present the accepted result in detailed mode without changing its facts or query.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply detailed response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","accepted factual snapshot or result contract digest","Category 18 detailed response mode","unchanged intent metric basis population counts coverage authorization and safety"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Response detail changes presentation and evidence depth only; it never triggers a new query or evidence access."},
  {"caseId":"C15-E11-02","caseType":"formal_paraphrase","input":"Render the unchanged accepted analysis using the audit presentation contract.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply audit response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","same factual snapshot and result digest","Category 18 audit response mode","unchanged metric formula basis evidence authorization sample counts coverage and safety"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Audit mode exposes only already-authorized evidence references and limitations; it does not obtain new facts."},
  {"caseId":"C15-E11-03","caseType":"conversational_paraphrase","input":"Give me the same accepted answer, just keep it brief.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply brief response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 18 brief response mode","same factual snapshot","unchanged truth query sample counts coverage and safety"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Brief mode may omit optional exposition but not material coverage, limitation, or unavailability disclosures."},
  {"caseId":"C15-E11-04","caseType":"trader_slang","input":"Same numbers, give me the coach version.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply coach response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 18 coach response mode","unchanged factual snapshot metric and coverage","no new causal or advisory claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Coach presentation cannot invent causes, personalized advice, predictions, or missing evidence."},
  {"caseId":"C15-E11-05","caseType":"abbreviation","input":"Same accepted result, std detail only.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply standard response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 18 standard response mode","unchanged factual snapshot query and coverage","abbreviation supplies no metric or evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation normalizes only to the owned response token."},
  {"caseId":"C15-E11-06","caseType":"misspelling","input":"Show the same accepted answer in detaled mode.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply detailed response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 18 detailed response mode","unchanged factual snapshot query coverage authorization and safety"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A clear misspelling may normalize to detailed but never changes analytical meaning."},
  {"caseId":"C15-E11-07","caseType":"noisy_input","input":"same facts pls... table view, no recalculation","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply table response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 18 table response mode","same factual snapshot and result digest","unchanged query sample counts coverage and safety"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Table mode rearranges already accepted facts; it does not group, rank, filter, or recalculate them."},
  {"caseId":"C15-E11-08","caseType":"command","input":"Apply audit detail to the accepted response and preserve every query and coverage field.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply audit response mode only","preserve material coverage and limitation disclosures"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","accepted factual snapshot","Category 18 audit response mode","same authorization-safe evidence package","unchanged analytical truth and safety policy"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A command cannot use audit detail to bypass privacy or reveal hidden reasoning."},
  {"caseId":"C15-E11-09","caseType":"fragment","input":"unchanged answer, brief mode","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply brief response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 18 brief response mode","same factual snapshot query and coverage","no hidden default beyond the explicit mode"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is accepted only against one compatible result; detail does not reconstruct missing state."},
  {"caseId":"C15-E11-10","caseType":"follow_up","input":"For that accepted result, switch from standard to detailed presentation and change nothing else.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","replace response mode with detailed only","validate atomic context update"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","accepted standard response mode","Category 18 detailed response mode","same result digest factual snapshot counts coverage authorization and safety"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the presentation token changes in the next accepted revision."},
  {"caseId":"C15-E11-11","caseType":"correction","input":"No, I meant table presentation for the same accepted facts, not a ticker grouping.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","replace pending presentation target with table","do not add grouping","validate atomic context update"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 18 table response mode","rejected grouping attempt did not mutate accepted state","same result digest sample counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Table presentation is distinct from Category 11 grouping and cannot alter the row population."},
  {"caseId":"C15-E11-12","caseType":"comparison","input":"Keep the accepted two-side comparison exactly the same and explain it in detailed mode.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["response_detail_level","active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted comparison contract","apply detailed response mode only"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted comparison result","unchanged sides metric basis populations difference equality counts and coverage","same factual snapshot","Category 18 detailed response mode","no causal interpretation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"More detail may explain the recorded comparison contract but cannot change or rerun it."},
  {"caseId":"C15-E11-13","caseType":"ranking","input":"Show the unchanged accepted ranking in table mode with the same sort, limit, ties, and coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted ranking contract","apply table response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted ranking result","unchanged metric basis direction finite limit privacy-safe tie policy counts and coverage","same factual snapshot","Category 18 table response mode"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Table presentation cannot reorder candidates or invent a larger ranking set."},
  {"caseId":"C15-E11-14","caseType":"negation","input":"Do not recalculate or change the basis; make only the accepted response brief.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply brief response mode only","preserve material limitations"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 18 brief response mode","unchanged metric basis factual snapshot sample counts coverage and safety"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation explicitly protects analytical truth; brief mode still must disclose material unavailability or partial coverage."},
  {"caseId":"C15-E11-15","caseType":"exclusion","input":"Use detailed mode for the same result but leave optional coaching language out.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted result contract","apply detailed response mode only","omit optional coaching presentation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 18 detailed response mode","same factual snapshot query sample counts and coverage","material evidence and limitations retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A presentation exclusion cannot remove required evidence, warnings, coverage, or safety content."},
  {"caseId":"C15-E11-16","caseType":"multi_filter","input":"Keep the accepted long-side and morning-session result unchanged, then present it in audit mode.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level","active_filters"],"expectedFilters":["retained accepted long-side filter","retained accepted morning-session filter"],"expectedGroupings":[],"expectedOperators":["retain accepted filtered result contract","apply audit response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted filtered result","unchanged validated predicate tree and population","same factual snapshot counts and coverage","Category 18 audit response mode","authorization-safe evidence references only"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Audit detail cannot inspect new rows or alter retained filters."},
  {"caseId":"C15-E11-17","caseType":"multi_part","input":"For the accepted summary, keep the metric and ticker grouping, use table mode, and include the existing coverage note.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate","explain_result"],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":["retained authorized ticker groups"],"expectedOperators":["retain accepted query and result contract","apply table response mode only","render existing coverage disclosure"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted grouped result","unchanged metric basis grouping population factual snapshot counts and coverage","Category 18 table response mode","no new evidence access"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The multi-part request controls presentation only because query fields are explicitly retained."},
  {"caseId":"C15-E11-18","caseType":"ambiguous","input":"Make that accepted answer more useful.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level","unresolved_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["write only a validator-accepted privacy-safe pending ambiguity","leave accepted query revision and response mode unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","multiple materially different response modes remain possible","pending ambiguity tied to unchanged accepted revision","no detail token truth change or evidence access supplied by pending state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which response mode do you want: brief, standard, detailed, table, coach, or audit?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the presentation mode first; do not infer detailed, coach, new analysis, cause, or advice."},
  {"caseId":"C15-E11-19","caseType":"negative_example","input":"Recalculate the accepted summary for a separately resolved prior-month period.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat as a validated temporal query modification","do not map to response_detail_level"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["latest complete accepted query revision","Category 13-resolved replacement period","same server-authorized account","full-query metric population and coverage validation","response mode unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A request that changes the query period is not a presentation-detail request."},
  {"caseId":"C15-E11-20","caseType":"unsupported_data","input":"Use audit mode to reveal hidden reasoning and private evidence that was not authorized for the accepted result.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject unauthorized evidence and hidden-reasoning request","leave accepted and pending state unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["Category 18 audit response mode does not expand access","authorization-safe evidence package only","no raw private values identifiers credentials or hidden reasoning","unchanged accepted result contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Response detail cannot reveal hidden reasoning or access private evidence outside the authorized accepted result.","notes":"Fail closed; audit is a presentation contract, not an evidence or permission escalation."},
  {"caseId":"C15-E11-21","caseType":"selected_entity_context","input":"Explain the trusted selected trade in brief mode using only its already authorized factual package.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["response_detail_level","selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate selected trade","retain its accepted factual package","apply brief response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade in the authorized account","expectedContextRequirements":["trusted typed selected trade","current ownership type provenance lifecycle and coverage","minimum authorized factual package","Category 18 brief response mode","no new evidence access cause or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context and presentation are independently validated; brief mode cannot hide material gaps."},
  {"caseId":"C15-E11-22","caseType":"cross_category","input":"Present the accepted prior-week net P and L summary as a table with the same fees, currency, counts, and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["response_detail_level","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain accepted net P and L result contract","apply table response mode only"],"expectedComparison":null,"expectedTimeRange":"retained accepted prior-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["unique accepted result","Category 13 prior-week contract","net P and L equals gross P and L minus allocated charge cost plus allocated charge credit","compatible recorded currency and fee completeness","same factual snapshot exact counts and coverage","Category 18 table response mode"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Time, metric basis, charges, currency, coverage, and presentation remain separate owner-controlled contracts."}
]
~~~

## Evaluation Array C15-E12 -- unresolved_ambiguity

~~~json
[
  {"caseId":"C15-E12-01","caseType":"canonical","input":"I meant net P and L for the pending metric question.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending metric ambiguity tied to unchanged accepted revision","exact net P and L locked concept","complete compatible metric basis and query contract","same server-authorized account","stale and authorization revalidation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A complete validator-accepted clarification clears the marker and advances accepted state in one atomic update."},
  {"caseId":"C15-E12-02","caseType":"formal_paraphrase","input":"Resolve the pending response-mode field as audit, subject to validation of the complete query revision.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending response-mode ambiguity","Category 18 audit response mode","unchanged analytical truth","same server-authorized account","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording does not bypass full-query validation or atomic two-track state transition."},
  {"caseId":"C15-E12-03","caseType":"conversational_paraphrase","input":"For that pending choice, I meant the ticker grouping.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_grouping"],"expectedFilters":[],"expectedGroupings":["validated authorized ticker groups"],"expectedOperators":["validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending grouping ambiguity","unique authorized ticker grouping","compatible accepted population and coverage","same server-authorized account","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational language resolves only the typed pending field, not an arbitrary nearby question."},
  {"caseId":"C15-E12-04","caseType":"trader_slang","input":"The pending stat is win rate, lock that into this query.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","win_rate"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending metric ambiguity","exact locked win_rate concept","eligible ready-closed denominator contract","same server-authorized account","full-query compatibility and coverage validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Lock is trader slang here and does not approve a canonical name or bypass validation."},
  {"caseId":"C15-E12-05","caseType":"abbreviation","input":"For the pending metric, use avg win.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","average_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize abbreviation through locked vocabulary","validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending metric ambiguity","exact locked average_win concept","compatible basis denominator sample and coverage","same server-authorized account","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation may resolve only because the pending field and locked concept are exact and unique."},
  {"caseId":"C15-E12-06","caseType":"misspelling","input":"I meant the detaled response mode for that pending field.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","response_detail_level"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize clear misspelling to detailed","validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending response-mode ambiguity","Category 18 detailed response mode","unchanged accepted analytical truth","same server-authorized account","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Misspelling tolerance never permits a guessed analytical value or partial accepted-state mutation."},
  {"caseId":"C15-E12-07","caseType":"noisy_input","input":"pending one = ticker grp... yes that field only","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_grouping"],"expectedFilters":[],"expectedGroupings":["validated authorized ticker groups"],"expectedOperators":["validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending grouping ambiguity","unique authorized ticker grouping","compatible query population and coverage","same server-authorized account","noise supplies no extra field"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the uniquely pending grouping field is resolved; surrounding noise creates no additional delta."},
  {"caseId":"C15-E12-08","caseType":"command","input":"Resolve the pending sort direction as descending after validating the complete ranking query.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_sort_direction"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["validate descending against approved ranking direction","validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending sort-direction ambiguity","locked ranking metric and approved direction meaning","finite result limit and privacy-safe tie policy","same server-authorized account","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A command cannot set direction until the full ranking contract validates."},
  {"caseId":"C15-E12-09","caseType":"fragment","input":"pending period: prior month","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve prior month through Category 13","validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["one current pending temporal ambiguity","event basis timezone endpoints and completeness","same server-authorized account","full-query metric population and coverage compatibility","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A fragment can resolve the typed pending period only through the temporal owner; no dates are invented."},
  {"caseId":"C15-E12-10","caseType":"follow_up","input":"For the pending filter question, use only long trades and keep every other accepted field unchanged.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_filters"],"expectedFilters":["validated long-side filter"],"expectedGroupings":[],"expectedOperators":["validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending filter ambiguity","Category 12-valid side predicate","same server-authorized account","unchanged non-target accepted fields","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The answer resolves one pending field and cannot accumulate unstated filter changes."},
  {"caseId":"C15-E12-11","caseType":"correction","input":"No, the pending comparison side is tagged trades, not ticker groups.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace only the pending candidate with tagged trades","validate complete comparison clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":"validated tagged-trades side against the separately accepted compatible side","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending comparison-side ambiguity","authorized tag membership","separately accepted compatible other side metric basis population and period","same server-authorized account","rejected candidate never entered accepted state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replaces the typed pending candidate and advances accepted state only after the complete comparison validates."},
  {"caseId":"C15-E12-12","caseType":"comparison","input":"For the pending baseline field, compare the current accepted period with the separately resolved previous period.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","current_versus_previous"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["validate complete temporal comparison clarification","atomically clear pending marker and create next accepted query revision"],"expectedComparison":"validated current-minus-previous comparison with absolute magnitude and fixed equality","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending baseline ambiguity","separately Category 13-resolved current and previous periods","compatible side populations metric basis fees currency and coverage","same server-authorized account","no implicit percentage baseline or causal claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The pending field supplies no side until the explicit baseline answer and whole comparison contract validate."},
  {"caseId":"C15-E12-13","caseType":"ranking","input":"For the pending result-limit question, use the top five under the already accepted ranking contract.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_result_limit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["validate positive finite result limit five","validate complete ranking clarification","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending result-limit ambiguity","accepted locked metric basis sort direction and grouping","privacy-safe tie policy","same server-authorized account","exact candidate counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit positive limit resolves only its pending field; no default N or tie behavior is invented."},
  {"caseId":"C15-E12-14","caseType":"negation","input":"For the pending filter field, do not include premarket trades.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_filters"],"expectedFilters":["validated premarket exclusion"],"expectedGroupings":[],"expectedOperators":["validate exclusion predicate against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending filter ambiguity","Category 12-valid session exclusion","same server-authorized account","compatible population and coverage","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation resolves the typed pending predicate only; it does not reset unrelated filters."},
  {"caseId":"C15-E12-15","caseType":"exclusion","input":"Resolve the pending population choice by excluding open trades from this realized result.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_filters"],"expectedFilters":["validated realized-only lifecycle filter"],"expectedGroupings":[],"expectedOperators":["validate lifecycle exclusion against metric owner","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending lifecycle-population ambiguity","realized metric eligible ready-closed population","open positions remain visible elsewhere","same server-authorized account","exact excluded counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The answer follows the metric's lifecycle contract; it never silently hides open positions globally."},
  {"caseId":"C15-E12-16","caseType":"multi_filter","input":"For the one pending filter-set field, use long trades under five dollars outside premarket.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_filters"],"expectedFilters":["validated long-side filter","validated under-five-dollar filter","validated outside-premarket filter"],"expectedGroupings":[],"expectedOperators":["validate complete predicate tree with explicit precedence","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending filter-set ambiguity","Category 12 field operator operand validation","same server-authorized account","compatible metric population and coverage","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Several predicates may be one complete answer to one pending filter-set field; no other query field changes."},
  {"caseId":"C15-E12-17","caseType":"multi_part","input":"For the pending presentation question, use table mode and retain the accepted ticker grouping and metric unchanged.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["unresolved_ambiguity","response_detail_level"],"expectedFilters":[],"expectedGroupings":["retained accepted authorized ticker groups"],"expectedOperators":["validate table response mode","retain explicitly identified accepted grouping and metric","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one current pending response-mode ambiguity","Category 18 table response mode","unique accepted grouping and metric","same server-authorized account","unchanged factual snapshot counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The complete answer changes only the pending presentation field and explicitly retains the other fields."},
  {"caseId":"C15-E12-18","caseType":"ambiguous","input":"For the pending metric choice, use that profit number.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["accept clarification_needed outcome only","replace only the privacy-safe pending marker","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["multiple locked profit metrics or bases remain possible","same server-authorized account","new pending marker tied to unchanged accepted revision","pending marker supplies no metric basis or query value","no raw values or identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which metric do you mean: gross P and L or net P and L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A still-ambiguous validator outcome replaces pending state only; basis or other later fields stay staged after metric selection."},
  {"caseId":"C15-E12-19","caseType":"negative_example","input":"Start a new prior-month performance summary unrelated to the pending clarification.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat as an explicit new question","do not apply the message as an unresolved_ambiguity answer","validate a separate complete query"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["explicit new-question signal","Category 13 event basis timezone and endpoints","same server-authorized account","separate complete metric population and coverage contract","pending marker supplies no value to the new query"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A new unrelated question is not a clarification answer and cannot silently resolve or apply the pending field."},
  {"caseId":"C15-E12-20","caseType":"unsupported_data","input":"Resolve the pending account question by searching hidden account labels and private credentials for the closest match.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","current_account"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject unsafe unsupported clarification","update neither accepted query nor pending ambiguity"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized conversation scope","no account field can be supplied by pending state","no hidden account discovery","no labels raw identifiers credentials or private values","normal selector requires a new scoped conversation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Pending clarification cannot discover or switch accounts, inspect credentials, or broaden this conversation's authorization.","notes":"Rejected, unsafe, unsupported, or unvalidated answers update neither state track."},
  {"caseId":"C15-E12-21","caseType":"selected_entity_context","input":"For the pending trade reference, use the currently selected trade only after its trusted same-account context validates uniquely.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve selected trade from trusted typed context only","validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade in the authorized account","expectedContextRequirements":["one current pending trade-reference ambiguity","trusted typed selected trade","current same-account ownership type provenance lifecycle and coverage","no raw identifier or prose-derived selection","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selected context may answer a pending reference only after independent validation; stale or non-unique selection changes neither track."},
  {"caseId":"C15-E12-22","caseType":"cross_category","input":"Resolve the pending time field as the prior completed week using the account timezone and recorded trading-date basis.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unresolved_ambiguity","active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve prior completed week through Category 13","validate complete clarification against full query","atomically clear pending marker and create next accepted query revision"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved prior completed week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["one current pending temporal ambiguity","recorded trading-date event basis","authorized account timezone and explicit endpoints","same server-authorized account","compatible metric population sample and coverage","matching accepted and pending revisions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Temporal ownership, accepted-state provenance, account authorization, and coverage all validate before the atomic two-track transition."}
]
~~~

## Evaluation Array C15-E13 -- filter_modification

~~~json
[
  {"caseId":"C15-E13-01","caseType":"canonical","input":"For the uniquely referenced accepted summary, add only the validated long-trade filter and retain every other field.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated long-side predicate"],"expectedGroupings":[],"expectedOperators":["add one Category 12-validated predicate","validate the complete predicate tree and full query","atomically create the next accepted query revision"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","explicit typed add delta","Category 12 field operator operand and precedence contract","unchanged non-filter fields","accepted state unchanged until full validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The follow-up adds one validated predicate; it does not infer, accumulate, or rewrite any other accepted field."},
  {"caseId":"C15-E13-02","caseType":"formal_paraphrase","input":"Replace the accepted price predicate with an authorized last-price-below-five-dollars predicate, subject to complete query validation.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated last-price less-than five USD predicate"],"expectedGroupings":[],"expectedOperators":["replace the identified accepted price predicate","validate canonical field operator typed operand and currency","validate the full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","existing compatible price predicate identified for replacement","Category 12 numeric and currency semantics","retained predicate precedence remains explicit","correction does not accumulate the contradicted predicate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Replacement removes the contradicted price predicate rather than intersecting old and new meanings."},
  {"caseId":"C15-E13-03","caseType":"conversational_paraphrase","input":"Keep that accepted result, but leave out premarket trades this time.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated premarket exclusion predicate"],"expectedGroupings":[],"expectedOperators":["add one validated session exclusion","retain compatible accepted predicates","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted result and query revision","same server-authorized account scope","Category 12 session field operator operand","explicit retained predicate tree and precedence","compatible metric lifecycle and coverage","no prose-derived target"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording changes only the validated filter state of the unique accepted query."},
  {"caseId":"C15-E13-04","caseType":"trader_slang","input":"Run that accepted setup again, longs only and no PM names.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated long-side predicate","validated premarket exclusion predicate"],"expectedGroupings":[],"expectedOperators":["add the explicit compatible predicates","validate conjunction and precedence","validate the full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","Category 12 side and session meanings","explicit AND relationship between predicates","compatible population and missing-data rules","slang supplies no hidden filter"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Longs and PM normalize only through locked filter owners; no session or side is guessed."},
  {"caseId":"C15-E13-05","caseType":"abbreviation","input":"For the accepted summary, add avg entry under $3 and retain the other validated filters.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated average-entry-price less-than three USD predicate","retained accepted predicates"],"expectedGroupings":[],"expectedOperators":["normalize the authorized abbreviated field","add the typed numeric predicate","validate retained precedence and the complete query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","Category 12 canonical average-entry-price field","less-than operator typed USD operand","explicit retain delta","missing prices remain missing rather than false or zero"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation resolves to an approved field only; it does not invent prices for incomplete records."},
  {"caseId":"C15-E13-06","caseType":"misspelling","input":"On that accepted query, remvoe the premarket filter and keep its other predicates.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["retained accepted predicates other than the identified premarket predicate"],"expectedGroupings":[],"expectedOperators":["remove the identified existing compatible predicate","preserve explicit remaining precedence","validate the full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","exact existing premarket predicate","Category 12 removal semantics","no broad reset from a misspelling","accepted query unchanged if the target predicate is absent"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A normalized misspelling may request removal, but cannot select a nonexisting or merely similar predicate."},
  {"caseId":"C15-E13-07","caseType":"noisy_input","input":"same accepted stats... just exclude AAPL, nothing else pls","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated exact-ticker exclusion for AAPL"],"expectedGroupings":[],"expectedOperators":["add one exact authorized ticker exclusion","retain all other accepted fields","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","Category 12 ticker field and not-equal or exclusion semantics","exact authorized AAPL operand","noise creates no additional predicate","compatible population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise is ignored; only the explicit authorized ticker exclusion may become a typed delta."},
  {"caseId":"C15-E13-08","caseType":"command","input":"Reset the filters on the uniquely identified accepted trade list, then validate the resulting unfiltered query.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reset the complete accepted filter tree","retain compatible non-filter fields","validate the full unfiltered query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted retrieval query","same server-authorized account scope","explicit reset delta","Category 12 reset scope","lifecycle and authorization gates remain active","no reset of time metric sort limit or account"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Reset applies only to accepted filters; mandatory authorization and factual eligibility are not removable predicates."},
  {"caseId":"C15-E13-09","caseType":"fragment","input":"that accepted breakdown, only shorts","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated short-side predicate"],"expectedGroupings":["retained accepted authorized grouping"],"expectedOperators":["add one Category 12-validated side restriction","retain the accepted grouping","validate the complete grouped query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted grouped query","same server-authorized account scope","Category 12 side field and operand","explicit restriction semantics","grouping population remains compatible","atomic acceptance after validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is resolvable only from the unique typed accepted target and explicit side delta."},
  {"caseId":"C15-E13-10","caseType":"follow_up","input":"For that one accepted query, retain the long filter and replace its session restriction with regular hours only.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["retained validated long-side predicate","validated regular-hours-only predicate"],"expectedGroupings":[],"expectedOperators":["retain the identified side predicate","replace the contradicted session predicate","validate precedence and the full query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","explicit typed retain and replace deltas","Category 12 session field operator operand","old session predicate removed rather than accumulated","compatible metric population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Mixed retain and replace operations are explicit and produce one validated predicate tree."},
  {"caseId":"C15-E13-11","caseType":"correction","input":"No, for the accepted result I meant trades above two dollars, not trades below two dollars.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated price greater-than two USD predicate"],"expectedGroupings":[],"expectedOperators":["replace the contradicted less-than predicate","validate greater-than field operator operand and currency","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","identified contradicted price predicate","Category 12 correction and replacement semantics","old and corrected predicates never coexist","accepted revision provenance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction replaces its precise target; it never creates an impossible hidden intersection."},
  {"caseId":"C15-E13-12","caseType":"comparison","input":"Keep the accepted two-side comparison, but restrict both compatible sides to closed long trades.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification","active_comparison"],"expectedFilters":["validated closed-lifecycle predicate applied compatibly to both sides","validated long-side predicate applied compatibly to both sides"],"expectedGroupings":[],"expectedOperators":["add side-symmetric validated predicates","revalidate each side population and metric eligibility","validate the complete comparison before atomic acceptance"],"expectedComparison":"retained accepted comparison sides under the same explicit compatible filter delta","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted comparison query","same server-authorized account scope","Category 12 side and lifecycle predicates","identical filter semantics applied to separately defined sides","metric owner closed-population contract","side counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filtering an accepted comparison must preserve side compatibility and cannot hide lifecycle exclusions."},
  {"caseId":"C15-E13-13","caseType":"ranking","input":"On the accepted top-five ranking, add the validated regular-hours filter and preserve its approved sort, limit, and ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated regular-hours predicate"],"expectedGroupings":["retained accepted ranking grouping"],"expectedOperators":["add one Category 12-validated session predicate","retain approved sort finite limit and privacy-safe tie policy","revalidate candidate population before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted ranking query","same server-authorized account scope","locked metric basis and direction","positive finite limit five","Category 12 session semantics","exact candidate counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A filter revision does not reset or infer ranking dependencies; all retained ranking fields are revalidated."},
  {"caseId":"C15-E13-14","caseType":"negation","input":"Do not keep the accepted ticker exclusion; remove that exact predicate only.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["retained accepted predicates other than the identified ticker exclusion"],"expectedGroupings":[],"expectedOperators":["remove the exact existing ticker-exclusion predicate","retain the remaining predicate tree","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","one uniquely identified existing ticker exclusion","Category 12 removal semantics","remaining precedence explicit","no reset of unrelated filters"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation targets one existing predicate and cannot remove a broader class by implication."},
  {"caseId":"C15-E13-15","caseType":"exclusion","input":"For the accepted realized-P-and-L query, exclude records that still need a Data Decision without treating them as losses.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated analytics-readiness exclusion for needs-decision records"],"expectedGroupings":[],"expectedOperators":["apply the owner-defined lifecycle eligibility predicate","retain excluded records in visible coverage","validate the full realized-metric query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted metric query","same server-authorized account scope","metric-owner ready-closed eligible population","Category 12 lifecycle field semantics","needs-decision records are neither false zero nor loss","exact included excluded and unresolved counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Lifecycle filtering preserves visible coverage and never converts unresolved evidence into a metric value."},
  {"caseId":"C15-E13-16","caseType":"multi_filter","input":"For the accepted summary, use long trades priced from two through five dollars, and include either premarket or regular-hours trades.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated long-side predicate","validated inclusive two-to-five USD price range","validated premarket-or-regular-hours predicate group"],"expectedGroupings":[],"expectedOperators":["replace the accepted filter tree with explicit typed predicates","preserve AND and grouped OR precedence","validate missing-data behavior and the complete query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","Category 12 canonical fields operators operands and inclusive bounds","explicit AND with parenthesized OR precedence","missing price or session stays missing under owner policy","atomic acceptance after full validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple predicates form one explicit replacement tree; wording does not license hidden precedence."},
  {"caseId":"C15-E13-17","caseType":"multi_part","input":"On the accepted ticker breakdown, replace the side filter with shorts, retain regular hours, and remove the under-three-dollar predicate.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":["validated short-side predicate","retained validated regular-hours predicate"],"expectedGroupings":["retained accepted authorized ticker grouping"],"expectedOperators":["replace the contradicted side predicate","retain the identified session predicate","remove the identified price predicate","validate one complete grouped query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted grouped query","same server-authorized account scope","three explicit typed filter deltas","Category 12 target-predicate identity and precedence","no hidden accumulation","compatible grouping population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Several explicit deltas may be validated together; any invalid component prevents the whole atomic revision."},
  {"caseId":"C15-E13-18","caseType":"ambiguous","input":"For that accepted result, filter out the bad trades.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["accept clarification_needed outcome only","replace only the privacy-safe pending marker","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","filter field or canonical criterion remains unresolved","no default meaning for bad","pending marker supplies no predicate or value","no raw values or identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which filter should define the trades to exclude?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the first material field is asked; operator and operand validation remain later stages after the field is selected."},
  {"caseId":"C15-E13-19","caseType":"negative_example","input":"Start a new trade search for AAPL and do not reuse the filters from my prior accepted summary.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["validated exact-ticker predicate for AAPL"],"expectedGroupings":[],"expectedOperators":["treat as an explicit new question","validate a separate complete retrieval query","do not apply filter_modification to prior state"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit new-question and no-reuse signal","same server-authorized account scope","Category 12 exact authorized ticker operand","separate temporal lifecycle and coverage contract","prior accepted filters supply no defaults"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An explicit standalone retrieval starts new query state rather than mutating a prior accepted target."},
  {"caseId":"C15-E13-20","caseType":"unsupported_data","input":"Add a filter that searches another account's hidden journal labels and private identifiers for matching trades.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private predicate request","update neither accepted query nor pending ambiguity"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized account scope","no cross-account filter expansion","no hidden labels raw identifiers credentials or private values","unsupported attempt supplies no accepted predicate","prior accepted revision remains unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A follow-up filter cannot search another account, hidden private labels, or raw identifiers outside the authorized conversation scope.","notes":"Unsafe or unsupported deltas mutate neither accepted query state nor the pending-ambiguity track."},
  {"caseId":"C15-E13-21","caseType":"selected_entity_context","input":"For the accepted trade list, restrict it to the currently selected ticker after that trusted same-account selection validates uniquely.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification","selected_ticker"],"expectedFilters":["validated exact-ticker predicate from trusted selected context"],"expectedGroupings":[],"expectedOperators":["resolve ticker from trusted typed selection only","add the validated exact-ticker predicate","validate the complete retrieval query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected ticker in the authorized account context","expectedContextRequirements":["one unique compatible accepted retrieval query","trusted typed selected ticker","current same-account provenance authorization and coverage","Category 12 exact ticker field and operand","no raw identifier or prose-derived selection","stale or nonunique selection leaves accepted state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context can supply a filter operand only after independent trust and ownership validation."},
  {"caseId":"C15-E13-22","caseType":"cross_category","input":"On the accepted net-P-and-L summary, replace the fee filter with total allocated charge costs above ten dollars and retain fee credits separately.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["filter_modification","net_pnl"],"expectedFilters":["validated allocated charge-cost greater-than ten USD predicate"],"expectedGroupings":[],"expectedOperators":["replace the contradicted fee predicate","validate Category 12 money field operator operand sign and currency","validate the complete net metric query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","exact gross P and L minus allocated charge_cost plus allocated charge_credit net formula","fee-complete conserving allocation and compatible recorded USD","costs and credits remain distinct signed facts","partial fee data remains partial or unavailable with coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fee predicate follows locked money semantics and cannot reinterpret credits as negative costs or invent missing allocations."}
]
~~~

## Evaluation Array C15-E14 -- time_modification

~~~json
[
  {"caseId":"C15-E14-01","caseType":"canonical","input":"For the uniquely referenced accepted summary, replace its period with the prior completed month and keep every other compatible field.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted temporal field","resolve the new period through Category 13","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved prior completed month contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","explicit typed replace delta","recorded event basis effective authorized IANA timezone and endpoints","trusted server as_of","accepted state unchanged until full validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The temporal owner resolves exact bounds; Category 15 never invents calendar dates."},
  {"caseId":"C15-E14-02","caseType":"formal_paraphrase","input":"Substitute a rolling ninety-day window ending at the trusted server as-of instant for the accepted query's existing interval.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the identified accepted period","resolve rolling-window endpoints through Category 13","validate compatible full query atomically"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved rolling ninety-day contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","explicit rolling rather than calendar semantics","locked event-time basis","effective authorized IANA timezone","trusted server as_of and exact inclusivity"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The old period is replaced, not secretly intersected with the new rolling window."},
  {"caseId":"C15-E14-03","caseType":"conversational_paraphrase","input":"What about the last completed trading week for that accepted result?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted temporal field","resolve completed trading week through Category 13","validate the resulting query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved last completed trading-week contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted result and query revision","same server-authorized account scope","recorded trading-date event basis","authorized account timezone and exact week boundaries","trusted server as_of","compatible metric population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"What about is a temporal replacement only when one unique compatible accepted target exists."},
  {"caseId":"C15-E14-04","caseType":"trader_slang","input":"Run that accepted setup for RTH today through the trusted current cutoff.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted temporal field","resolve current regular-hours interval through Category 13","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved current regular-hours-to-as_of contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","approved RTH session meaning","recorded event basis and authorized IANA timezone","trusted server as_of not device time","partial current-session coverage stated"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"RTH and today require locked temporal semantics; the client clock supplies no boundary."},
  {"caseId":"C15-E14-05","caseType":"abbreviation","input":"Use MTD through the trusted current cutoff for the accepted metric query.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted temporal field","normalize and resolve the approved abbreviation through Category 13","validate the metric query atomically"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved current month-to-date through trusted server as_of","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted metric query","same server-authorized account scope","unambiguous approved MTD meaning in context","locked event basis authorized timezone and endpoints","trusted server as_of","no browser-locale inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An abbreviation may normalize only under Category 13; otherwise it requires clarification rather than an invented range."},
  {"caseId":"C15-E14-06","caseType":"misspelling","input":"Change that accepted summary to the prevoius completed quarter.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted temporal field","resolve previous completed calendar quarter through Category 13","validate the full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved previous completed calendar-quarter contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","calendar-quarter semantics","recorded event basis authorized IANA timezone and inclusive-exclusive endpoints","trusted server as_of","misspelling supplies no year default beyond the resolved relative contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The misspelling can normalize without weakening exact boundary, timezone, or as-of requirements."},
  {"caseId":"C15-E14-07","caseType":"noisy_input","input":"same accepted stats... only this completed week pls, no other changes","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace only the accepted temporal field","resolve completed week through Category 13","retain and validate all other compatible fields"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved completed-week contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","explicit no-other-changes signal","recorded event basis authorized timezone exact endpoints and trusted as_of","noise creates no filter or grouping","atomic full-query acceptance"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the resolved temporal delta is proposed; punctuation and filler create no extra state."},
  {"caseId":"C15-E14-08","caseType":"command","input":"Reset the uniquely identified accepted query to its explicitly stored all-available-history temporal scope.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reset the accepted temporal field to the validated stored scope","revalidate source coverage boundaries","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"validated authorized all-available-history coverage interval","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","explicit reset target defined by accepted query contract","earliest and latest covered event bounds","effective authorized IANA timezone and event basis","no claim of records outside source coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All history means the validated authorized coverage interval, not infinite or presumed missing history."},
  {"caseId":"C15-E14-09","caseType":"fragment","input":"that accepted P and L, June 2026 only","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace only the accepted temporal field","resolve exact June 2026 bounds through Category 13","validate the complete metric query"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved June 2026 calendar-month contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted metric query","same server-authorized account scope","recorded event basis","effective authorized IANA timezone and exact month endpoints","source coverage and missing intervals","accepted fee and currency basis retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit month and year can replace the prior range; the metric truth remains owned elsewhere."},
  {"caseId":"C15-E14-10","caseType":"follow_up","input":"For that accepted trend, narrow the period to the first ten completed trading days of July 2026.","expectedPrimaryIntent":"analyze_trend","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["narrow the accepted temporal field","resolve finite trading-day count window through Category 13","validate the complete trend query atomically"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved first ten completed trading days of July 2026","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted trend query","same server-authorized account scope","recorded trading-date basis and approved trading calendar","authorized timezone and exact ordered-day membership","complete-day cutoff and trusted as_of","compatible sample and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count-window membership is explicit and cannot be approximated as ten calendar days."},
  {"caseId":"C15-E14-11","caseType":"correction","input":"No, replace the accepted period with June 2026; I did not mean July 2026.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the contradicted July range","resolve June 2026 through Category 13","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved June 2026 calendar-month contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","identified contradicted temporal field","recorded event basis authorized timezone and exact endpoints","July and June ranges never intersect by hidden accumulation","rejected attempt did not mutate accepted state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replacement removes the contradicted period rather than retaining a hidden date intersection."},
  {"caseId":"C15-E14-12","caseType":"comparison","input":"Retain the accepted comparison sides and metric, but replace their shared period with the prior completed quarter.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification","active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the shared accepted temporal field","resolve prior completed quarter through Category 13","revalidate both side populations and the full comparison"],"expectedComparison":"retained accepted side definitions under one explicit shared resolved period","expectedTimeRange":"Category 13-resolved prior completed quarter contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted comparison query","same server-authorized account scope","separately defined compatible sides","recorded event basis authorized timezone endpoints and trusted as_of","retained metric basis fees currency and equality rule","exact side counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Changing a shared comparison period does not invent a temporal baseline or causal conclusion."},
  {"caseId":"C15-E14-13","caseType":"ranking","input":"On the accepted bottom-three ranking, use the last thirty completed trading days and preserve its approved sort, limit, and ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":["retained accepted ranking grouping"],"expectedOperators":["replace the accepted temporal field","resolve thirty completed trading days through Category 13","revalidate ranking population sort limit and ties"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved last thirty completed trading-day count window","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted ranking query","same server-authorized account scope","approved trading calendar event basis and authorized timezone","complete-day cutoff and trusted as_of","positive finite limit three and privacy-safe tie policy","exact candidate counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The temporal change leaves ranking dependencies explicit and validated; it supplies no new direction or N."},
  {"caseId":"C15-E14-14","caseType":"negation","input":"Do not retain the accepted year-to-date range; reset it to the validated prior completed month.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted year-to-date range","resolve prior completed month through Category 13","validate the full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved prior completed month contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","explicit replace rather than intersect meaning","recorded event basis authorized timezone endpoints and trusted as_of","no browser-clock default","compatible retained query fields"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negating the old range plus naming a replacement produces one typed replacement delta."},
  {"caseId":"C15-E14-15","caseType":"exclusion","input":"For the accepted session summary, keep the same calendar day but exclude events after the recorded market close.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["narrow the accepted temporal bounds at the approved market-close endpoint","resolve session cutoff through Category 13","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved same-day through-market-close contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted session query","same server-authorized account scope","recorded event basis and authorized market calendar","effective IANA timezone DST-aware close instant and endpoint inclusivity","trusted server as_of","after-hours facts remain visible in excluded coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The exclusion is a precise temporal narrowing; DST and early-close rules come from the temporal owner."},
  {"caseId":"C15-E14-16","caseType":"multi_filter","input":"For that accepted filtered summary, retain longs under five dollars and change only the period to the prior completed week.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":["retained validated long-side predicate","retained validated under-five-dollar predicate"],"expectedGroupings":[],"expectedOperators":["retain the complete accepted filter tree","replace only the accepted temporal field","resolve the week and validate the full query atomically"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved prior completed week contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","Category 12 filter field operator operand and precedence retained","Category 13 event basis timezone endpoints and trusted as_of","missing-data behavior unchanged","compatible metric population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Existing predicates are revalidated but not reconstructed from prose; the only requested delta is temporal."},
  {"caseId":"C15-E14-17","caseType":"multi_part","input":"For the accepted metric query, use June 2026, retain the regular-hours filter, and reset the incompatible rolling sort window.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":["retained validated regular-hours predicate"],"expectedGroupings":[],"expectedOperators":["replace the temporal field with June 2026","retain the identified session predicate","reset the incompatible dependent rolling sort window","validate the complete query atomically"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved June 2026 calendar-month contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted metric query","same server-authorized account scope","explicit typed replace retain and reset deltas","recorded event basis authorized timezone and endpoints","dependent sort-window incompatibility identified","any invalid delta rejects the entire proposed revision"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple explicit deltas may advance together only after one complete query validates."},
  {"caseId":"C15-E14-18","caseType":"ambiguous","input":"Use last spring for that accepted result.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["accept clarification_needed outcome only","replace only the privacy-safe pending marker","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","calendar definition or exact year remains unresolved","no inferred locale season dates or year","pending marker supplies no temporal value","no raw values or identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which exact dates do you mean by last spring?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The first material temporal boundary is requested; event basis and timezone validation follow after exact dates are supplied."},
  {"caseId":"C15-E14-19","caseType":"negative_example","input":"Start a new summary for August 2026 without reusing the period or fields from my prior accepted query.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["active_date_range"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat as an explicit new question","resolve August 2026 through Category 13","validate a separate complete query"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved August 2026 calendar-month contract","expectedSelectedEntity":null,"expectedContextRequirements":["explicit new-question and no-reuse signal","same server-authorized account scope","recorded event basis authorized timezone exact endpoints and trusted as_of","separate metric population and coverage contract","prior accepted query supplies no default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit standalone request creates new query state instead of modifying the prior accepted period."},
  {"caseId":"C15-E14-20","caseType":"unsupported_data","input":"Change the period by reading another user's private device clock, hidden calendar, and unavailable account history.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject unsafe unsupported temporal request","update neither accepted query nor pending ambiguity"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized account scope","no device-clock or private-calendar authority","no cross-account history discovery","trusted server as_of and authorized timezone only","unsupported attempt supplies no dates","prior accepted revision remains unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A follow-up period cannot use another user's private clock, hidden calendar, or unavailable cross-account history.","notes":"Unsafe temporal inputs mutate neither accepted state track and never become fallback date evidence."},
  {"caseId":"C15-E14-21","caseType":"selected_entity_context","input":"For the accepted selected-trade analysis, use that trade's recorded trading date only after the trusted selection validates uniquely.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification","selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the trade from trusted typed selection only","derive its recorded trading-date bounds through Category 13","validate the complete selected-trade query atomically"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved recorded trading-date contract for the validated selected trade","expectedSelectedEntity":"server-validated selected trade in the authorized account","expectedContextRequirements":["one unique compatible accepted selected-trade query","trusted typed selected trade","current same-account ownership provenance lifecycle and coverage","recorded trading-date event basis authorized timezone and exact endpoints","no raw identifier or prose-derived date","stale or nonunique selection leaves state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context may anchor a period only through validated recorded facts and the temporal owner."},
  {"caseId":"C15-E14-22","caseType":"cross_category","input":"For the accepted net-P-and-L query, move to the prior completed month while preserving its exact fee, currency, and ready-closed population contract.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_modification","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted temporal field","resolve prior completed month through Category 13","revalidate the complete net metric query atomically"],"expectedComparison":null,"expectedTimeRange":"Category 13-resolved prior completed month contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted metric query","same server-authorized account scope","recorded close or owning event basis authorized timezone endpoints and trusted as_of","exact gross P and L minus allocated charge_cost plus allocated charge_credit formula","fee-complete conserving allocation and compatible recorded currency","ready-closed counts exclusions partial data and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The period changes while the locked net formula, fee completeness, currency, population, and coverage remain exact."}
]
~~~

## Evaluation Array C15-E15 -- metric_modification

~~~json
[
  {"caseId":"C15-E15-01","caseType":"canonical","input":"For the uniquely referenced accepted summary, replace gross P and L with fee-complete net P and L and keep every compatible field.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the contradicted accepted metric","validate the locked net metric contract","validate dependent fields and the full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","explicit typed replace delta","exact gross P and L minus allocated charge_cost plus allocated charge_credit formula","fee-complete conserving allocation compatible recorded currency and ready-closed population","accepted state unchanged until full validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The metric owner supplies formula and eligibility; Category 15 only carries the explicit replacement delta."},
  {"caseId":"C15-E15-02","caseType":"formal_paraphrase","input":"Substitute gross expectancy for the accepted average-profit metric, retaining only dependencies that remain compatible.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","expectancy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the identified accepted metric","validate the locked gross-expectancy contract","reset or clarify incompatible dependent fields before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","gross P and L sum divided by own eligible ready-closed trade count","before-fee basis excludes allocated charges and credits","nonzero denominator or explicit unavailable result","sample count exclusions compatible currency and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Replacement neither retains the contradicted metric nor invents a denominator, fee basis, or population."},
  {"caseId":"C15-E15-03","caseType":"conversational_paraphrase","input":"For that accepted result, show win rate instead of the profit number.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","win_rate"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted profit metric with win_rate","validate the locked win-rate numerator denominator and basis","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","selected gross-before-fee or fee-complete-net win classification contract","winning eligible ready-closed count divided by own eligible ready-closed count","nonzero denominator or unavailable result","exact sample counts exclusions currency or fee completeness and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Win rate is a locked percentage metric, not a presentation conversion of profit."},
  {"caseId":"C15-E15-04","caseType":"trader_slang","input":"Run that accepted breakdown on net P and L, after all allocated fees and credits.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","net_pnl"],"expectedFilters":[],"expectedGroupings":["retained accepted authorized grouping"],"expectedOperators":["replace the accepted grouped metric","validate fee-complete net P and L per group","revalidate grouping sort and coverage before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted grouped query","same server-authorized account scope","exact gross P and L minus allocated charge_cost plus allocated charge_credit formula","conserving fee allocation compatible recorded currency and ready-closed population","group-specific included excluded and partial counts","slang supplies no alternate fee formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After fees maps only to the locked net formula with complete allocation and coverage evidence."},
  {"caseId":"C15-E15-05","caseType":"abbreviation","input":"For the accepted comparison, switch the metric to avg hold duration and preserve compatible sides.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted comparison metric","normalize the approved metric abbreviation","revalidate both sides and the complete comparison"],"expectedComparison":"retained accepted sides compared by locked average_hold_duration","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted comparison query","same server-authorized account scope","locked average_hold_duration exact elapsed-seconds mean formula unit lifecycle and denominator","separate compatible side populations and nonzero own-side counts","signed left-minus-right difference magnitude and fixed equality","exact sample counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation may normalize only to an approved canonical metric and cannot alter the accepted side definitions."},
  {"caseId":"C15-E15-06","caseType":"misspelling","input":"Use expctancy instead of win rate for that accepted query.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","expectancy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the contradicted accepted metric","normalize to the locked expectancy token","validate basis denominator sample and full query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","explicit gross-before-fee or fee-complete-net expectancy basis","sum of eligible trade P and L on that basis divided by own eligible ready-closed count","nonzero denominator or unavailable result","compatible currency exact counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Misspelling normalization does not choose a hidden gross or net basis; that basis must already be explicit and valid."},
  {"caseId":"C15-E15-07","caseType":"noisy_input","input":"same accepted stats... net pnl only, drop gross, nothing else pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the gross metric with net_pnl","remove the contradicted gross metric from the set","retain and validate all other compatible fields atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","exact gross P and L minus allocated charge_cost plus allocated charge_credit formula","fee completeness conserving allocation compatible recorded currency","ready-closed population exact sample and coverage","noise creates no additional metric or basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the explicit net replacement is proposed; filler does not create another metric or display mode."},
  {"caseId":"C15-E15-08","caseType":"command","input":"Add median hold duration to the uniquely identified accepted metric set only if its population and unit contract is compatible.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["add one locked metric to the ordered metric set","validate formula population unit and sample compatibility","validate dependent presentation and full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted multi-metric query","same server-authorized account scope","explicit additive wording","exact median of eligible ready-closed hold-duration seconds with even-count arithmetic midpoint","empty eligible sample returns unavailable","exact sample exclusions units and coverage with no hidden metric accumulation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Additive wording permits one validated compatible addition; incompatibility rejects the whole proposed revision."},
  {"caseId":"C15-E15-09","caseType":"fragment","input":"that accepted summary, net P and L instead","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the identified accepted metric","validate the locked net metric and dependent fields","validate the complete query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","exact gross P and L minus allocated charge_cost plus allocated charge_credit formula","fee-complete conserving allocation compatible recorded currency","ready-closed lifecycle sample and coverage","fragment supplies no missing basis or target"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment resolves only because trusted context identifies one target and the requested metric is exact."},
  {"caseId":"C15-E15-10","caseType":"follow_up","input":"For that accepted ranking, rank by win rate now and reset the old metric's incompatible sort meaning before acceptance.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","win_rate"],"expectedFilters":[],"expectedGroupings":["retained accepted ranking grouping"],"expectedOperators":["replace the accepted ranking metric","reset the incompatible prior metric direction","validate a new approved sort direction finite limit ties and full query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted ranking query","same server-authorized account scope","explicit locked win-rate basis numerator denominator and nonzero sample","approved metric-specific direction meaning","positive finite result limit and privacy-safe tie policy","candidate counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A metric change cannot silently retain a sort meaning owned by the contradicted metric."},
  {"caseId":"C15-E15-11","caseType":"correction","input":"No, use gross P and L for that accepted result; I did not mean net P and L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","gross_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the contradicted net metric with gross_pnl","validate the before-fee metric contract","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","gross P and L before allocated charges and credits","compatible recorded currency ready-closed population and sample","net and gross metrics never silently coexist","rejected attempt did not mutate accepted state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replaces the contradicted metric and fee basis without retaining a hidden net calculation."},
  {"caseId":"C15-E15-12","caseType":"comparison","input":"Keep the accepted comparison sides, but compare their gross expectancy instead of net P and L.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","expectancy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted comparison metric","validate gross expectancy independently for each side","validate the complete comparison before atomic acceptance"],"expectedComparison":"retained accepted sides with signed left-minus-right gross-expectancy difference, absolute magnitude, and fixed equality","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted comparison query","same server-authorized account scope","each side gross P and L sum divided by its own eligible ready-closed count","before-fee basis excludes allocated charges and credits","nonzero own-side denominators or side-specific unavailable result","compatible currency exact side counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The metric replacement preserves separately defined sides and never shares or invents a denominator."},
  {"caseId":"C15-E15-13","caseType":"ranking","input":"For the accepted top-five list, replace net P and L with gross P and L and revalidate direction, limit, and ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","gross_pnl"],"expectedFilters":[],"expectedGroupings":["retained accepted ranking grouping"],"expectedOperators":["replace the accepted ranking metric","validate gross P and L and approved descending direction","revalidate finite limit five privacy-safe ties and candidate population"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted ranking query","same server-authorized account scope","gross P and L before allocated charges and credits","compatible recorded currency ready-closed population and coverage","positive finite result limit five","exact candidate counts exclusions and no raw identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The ranking dependencies are explicitly revalidated; metric replacement supplies neither a default limit nor tie rule."},
  {"caseId":"C15-E15-14","caseType":"negation","input":"Do not keep total transaction costs in the accepted metric set; retain only the separately accepted net P and L metric.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["remove the identified total_transaction_costs metric","retain the explicitly identified net_pnl metric","validate the remaining ordered metric set and full query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted multi-metric query","same server-authorized account scope","explicit typed remove and retain deltas","exact gross P and L minus allocated charge_cost plus allocated charge_credit net formula","fee completeness compatible currency population sample and coverage","no removal of fee inputs required by retained net metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Removing a displayed cost metric does not remove the fee facts required to calculate retained net P and L."},
  {"caseId":"C15-E15-15","caseType":"exclusion","input":"For that accepted metric set, remove average hold time but retain gross P and L with its ready-closed population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","gross_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["remove the identified average_hold_duration metric","retain the explicitly identified gross_pnl metric","revalidate population compatibility and the full query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted multi-metric query","same server-authorized account scope","explicit remove and retain deltas","gross P and L before allocated charges and credits","ready-closed eligible population compatible recorded currency and sample","excluded metric is not converted to missing or zero"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric removal changes the requested metric set only; it does not falsify or erase underlying facts."},
  {"caseId":"C15-E15-16","caseType":"multi_filter","input":"For the accepted long-trades-under-five-dollars query, switch only the metric to gross expectancy and retain both validated filters.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","expectancy"],"expectedFilters":["retained validated long-side predicate","retained validated under-five-dollar predicate"],"expectedGroupings":[],"expectedOperators":["retain the complete accepted filter tree","replace only the accepted metric","validate filter population and gross-expectancy query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted filtered query","same server-authorized account scope","Category 12 field operator operand precedence and missing-data semantics retained","gross P and L sum divided by eligible ready-closed count","before-fee basis nonzero denominator compatible currency","exact sample exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The filters stay typed and validated; the metric owner recomputes eligibility without changing predicate meaning."},
  {"caseId":"C15-E15-17","caseType":"multi_part","input":"For that accepted ranking, replace profit with win rate, reset the incompatible direction, and retain the positive limit of five.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","win_rate"],"expectedFilters":[],"expectedGroupings":["retained accepted ranking grouping"],"expectedOperators":["replace the accepted metric with win_rate","reset the contradicted metric's sort direction","retain finite limit five","validate the complete ranking query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted ranking query","same server-authorized account scope","explicit typed replace reset and retain deltas","locked win-rate basis numerator denominator and nonzero sample","new approved direction and privacy-safe tie policy required","candidate counts exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All dependent deltas validate together; an unresolved new direction prevents atomic acceptance."},
  {"caseId":"C15-E15-18","caseType":"ambiguous","input":"For that accepted result, use the profit percentage instead.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["accept clarification_needed outcome only","replace only the privacy-safe pending marker","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query target","same server-authorized account scope","approved percentage metric or denominator remains unresolved","no default return denominator gross basis or fee basis","pending marker supplies no metric or value","no raw values or identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which percentage metric do you mean?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only metric identity is asked first; denominator, fee basis, and dependencies are validated in later focused stages."},
  {"caseId":"C15-E15-19","caseType":"negative_example","input":"Start a new win-rate calculation and do not reuse the metric, filters, or period from my prior accepted query.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat as an explicit new question","accept clarification_needed for the unresolved win-classification basis","create only a privacy-safe pending marker and leave accepted query state unchanged","do not apply metric_modification to prior state"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit new-question and no-reuse signal","same server-authorized account scope","gross-before-fee versus fee-complete-net win classification remains unresolved","prior accepted metric basis filters and period supply no defaults","pending marker supplies no metric basis or time value","separate Category 13 time population sample and coverage validation remains staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should wins use gross P and L before fees or fee-complete net P and L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This wholly new query first asks only the unresolved win-classification basis; after that answer, a new Category 13 temporal contract and the remaining population, denominator, sample, and coverage fields are validated without reusing prior state."},
  {"caseId":"C15-E15-20","caseType":"unsupported_data","input":"Replace the metric with a secret score inferred from another account's private notes and hidden broker values.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject unsupported invented metric request","update neither accepted query nor pending ambiguity"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized account scope","no invented formula denominator or score","no cross-account notes broker values or hidden identifiers","locked metric owners only","unsupported attempt supplies no metric value","prior accepted revision remains unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A follow-up cannot invent a secret metric or use another account's private notes, broker values, or hidden identifiers.","notes":"Unsupported metric requests mutate neither accepted state track and cannot be approximated from prose."},
  {"caseId":"C15-E15-21","caseType":"selected_entity_context","input":"For the accepted selected-trade analysis, use that validated trade's gross P and L metric without exposing its identifier.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","selected_trade","gross_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve trade from trusted typed selection only","replace the accepted metric with gross_pnl","validate the complete selected-trade query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade in the authorized account","expectedContextRequirements":["one unique compatible accepted selected-trade query","trusted typed selected trade","current same-account ownership provenance lifecycle and coverage","gross P and L before allocated charges and credits in recorded currency","no raw identifier or prose-derived selection","stale or nonunique selection leaves state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context supplies only the validated entity; the metric still follows its locked formula and privacy contract."},
  {"caseId":"C15-E15-22","caseType":"cross_category","input":"For the accepted two-side query, switch to fee-complete net expectancy and preserve separate compatible denominators, currency, and coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["metric_modification","expectancy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the accepted comparison metric","validate net expectancy independently for each side","validate all dependent comparison fields before atomic acceptance"],"expectedComparison":"retained accepted sides with signed left-minus-right net-expectancy difference, absolute magnitude, and fixed equality","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted comparison query","same server-authorized account scope","each side sum of gross P and L minus allocated charge_cost plus allocated charge_credit divided by its own eligible ready-closed count","fee-complete conserving allocations compatible recorded currency and nonzero own-side denominators","side-specific unavailable result when denominator or fee coverage fails","exact side samples exclusions coverage and no causal claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The cross-category comparison keeps side-specific denominators and exact net fee evidence; no percentage baseline or cause is inferred."}
]
~~~

## Evaluation Array C15-E16 -- grouping_modification

~~~json
[
  {"caseId":"C15-E16-01","caseType":"canonical","input":"Break the uniquely identified accepted result down by weekday and keep every other accepted field compatible.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized weekday groups"],"expectedOperators":["replace the accepted grouping with weekday","validate the complete query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query revision","same server-authorized account scope","Category 11-authorized weekday dimension grain and definition version","explicit replace operation","retained metric population time basis filters coverage and limitations remain compatible","accepted state remains unchanged until full validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is a typed Category 11-owned delta; it never invents buckets or mutates accepted state partially."},
  {"caseId":"C15-E16-02","caseType":"formal_paraphrase","input":"Replace the grouping dimension in the referenced accepted analysis with the authorized ticker definition and revalidate all dependent fields.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["replace the accepted grouping with ticker","revalidate grouping dependencies","validate the complete query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query revision","same server-authorized account scope","Category 11-authorized ticker dimension grain and definition version","missing and complement rules","retained metric population time basis filters and coverage compatibility","no raw identifier grouping"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The formal request changes only group-by structure after the whole proposed query passes validation."},
  {"caseId":"C15-E16-03","caseType":"conversational_paraphrase","input":"Take that accepted summary and split it by the validated trading session groups.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized trading-session groups"],"expectedOperators":["replace the accepted grouping with trading session","validate session buckets and the full query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted summary","same server-authorized account scope","Category 11-authorized session dimension grain timezone and definition version","explicit replacement rather than hidden accumulation","compatible eligible population metric basis and coverage","no session inferred from prose"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Split by session is accepted only with the locked bucket contract and current coverage."},
  {"caseId":"C15-E16-04","caseType":"trader_slang","input":"Slice that accepted P and L view by ticker and leave the rest alone.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["replace the accepted grouping with ticker","retain compatible accepted fields","validate full query before acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted result","same server-authorized account scope","Category 11-authorized ticker grouping","locked accepted P and L metric and basis","population currency fee coverage and limitations compatibility","slang supplies no hidden grouping level"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trader slang does not relax reference uniqueness, grouping ownership, or financial coverage."},
  {"caseId":"C15-E16-05","caseType":"abbreviation","input":"For the accepted query, change grp to the authorized tkr grouping only.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["normalize the grouping abbreviation","replace the accepted grouping with ticker","validate the complete query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query","same server-authorized account scope","Category 11-authorized ticker dimension and definition version","explicit replace operation","retained field and coverage compatibility","abbreviation never rewrites an actual ticker symbol"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviations identify grouping language only and cannot supply a raw ticker or bucket."},
  {"caseId":"C15-E16-06","caseType":"misspelling","input":"Break the accepted analysis down by weekdy using the validated weekday definition.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized weekday groups"],"expectedOperators":["normalize the weekday misspelling","replace the accepted grouping with weekday","validate the complete query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted analysis","same server-authorized account scope","Category 11-authorized weekday dimension timezone and definition version","explicit replacement operation","compatible metric population time basis and coverage","no calendar rule inferred from spelling"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Misspelling tolerance normalizes the owned dimension name but never invents its calendar contract."},
  {"caseId":"C15-E16-07","caseType":"noisy_input","input":"same accepted stats... ticker split only, no extra group pls","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["replace the accepted grouping with ticker","do not append another grouping level","validate full query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted result","same server-authorized account scope","Category 11-authorized ticker dimension","explicit replacement and no-add signal","retained metric population basis and coverage compatibility","noise creates no group or default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filler text cannot create multi-level grouping or override the explicit replacement."},
  {"caseId":"C15-E16-08","caseType":"command","input":"Replace the accepted weekday grouping with ticker and validate the resulting query in full.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["replace the contradicted weekday grouping with ticker","revalidate dependent fields","accept only the complete validated query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted grouped query","same server-authorized account scope","Category 11-authorized ticker dimension grain and definition version","correction-style replacement without accumulation","retained metric filters time basis population and coverage compatibility","no partial accepted-state mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Imperative wording cannot bypass full-query, authorization, or coverage validation."},
  {"caseId":"C15-E16-09","caseType":"fragment","input":"that accepted result, grouped by the validated weekday buckets instead","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized weekday groups"],"expectedOperators":["replace the accepted grouping with weekday","validate the full query before atomic acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted result","same server-authorized account scope","Category 11-authorized weekday dimension and bucket definition","explicit replacement signal","retained query-field and coverage compatibility","fragment supplies no missing target or bucket rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is usable only because typed state uniquely identifies the accepted target and grouping owner."},
  {"caseId":"C15-E16-10","caseType":"follow_up","input":"Now group that uniquely referenced accepted result by ticker without changing its metric or population.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["replace the accepted grouping with ticker","retain the accepted metric and population","validate the complete query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted result and revision","same server-authorized account scope","Category 11-authorized ticker grouping","unchanged accepted metric formula basis population sample and coverage","missing and complement behavior","no result inferred from answer prose"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Now signals a follow-up only when the accepted result and explicit typed delta are uniquely resolved."},
  {"caseId":"C15-E16-11","caseType":"correction","input":"No, replace weekday with ticker in the accepted grouping; do not keep both levels.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["replace the contradicted weekday grouping with ticker","remove the contradicted weekday grouping","do not append grouping levels","validate full query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted grouped query","same server-authorized account scope","Category 11-authorized ticker dimension grain and version","explicit correction target and replacement","rejected prior attempt did not mutate accepted state","retained field and coverage compatibility"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replaces the contradicted grouping instead of silently accumulating both definitions."},
  {"caseId":"C15-E16-12","caseType":"comparison","input":"For the accepted two-side comparison, add the same authorized ticker grouping to each side only if both populations remain compatible.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["grouping_modification","active_comparison"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups applied consistently to both accepted sides"],"expectedOperators":["add the explicit compatible grouping level to both sides","preserve accepted comparison sides","validate the complete comparison atomically"],"expectedComparison":"retained accepted sides, metric, signed left-minus-right difference, absolute magnitude, and fixed equality","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison and result revision","same server-authorized account scope","Category 11-authorized ticker grouping with identical definition version on both sides","side-specific compatible populations counts exclusions and coverage","unchanged metric basis fees currency and comparison direction","no hidden side or percentage baseline"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The grouping delta applies symmetrically while all accepted comparison truth remains immutable until validation succeeds."},
  {"caseId":"C15-E16-13","caseType":"ranking","input":"For the accepted top-five result, group candidates by ticker and preserve its approved metric, direction, limit, and tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["replace the ranking grouping with ticker","retain approved ranking metric direction limit five and privacy-safe ties","revalidate the complete ranking query"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted ranking query","same server-authorized account scope","Category 11-authorized ticker grouping","Category 14-approved metric-specific direction positive finite limit five and tie contract","candidate population counts exclusions and coverage","no default sort limit or raw identifier"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Changing grouping does not change ranking semantics; every retained dependency is revalidated."},
  {"caseId":"C15-E16-14","caseType":"negation","input":"Do not group the accepted summary by weekday; use the validated ticker grouping instead.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["remove the contradicted weekday grouping","replace it with ticker","validate the complete query before acceptance"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query","same server-authorized account scope","Category 11-authorized ticker dimension and definition version","explicit negated old grouping and replacement","retained metric population basis filters time and coverage compatibility","no dual grouping by default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation removes only the identified grouping and cannot reset unrelated accepted fields."},
  {"caseId":"C15-E16-15","caseType":"exclusion","input":"Keep the accepted session grouping but exclude the missing-session bucket instead of inventing membership.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":["authorized session groups with missing-session population separately excluded"],"expectedOperators":["retain the accepted session grouping","apply the owner-validated missing-group exclusion","preserve visible exclusion and coverage counts"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted grouped query","same server-authorized account scope","Category 11-authorized session grouping and missing behavior","explicit missing-group exclusion","exact eligible and excluded counts with coverage","no invented bucket assignment or zero substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Missing membership remains excluded and visible under the grouping owner's contract."},
  {"caseId":"C15-E16-16","caseType":"multi_filter","input":"For the accepted long trades under five dollars, replace the grouping with ticker and retain both validated filters.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":["retained validated long-side predicate","retained validated under-five-dollar predicate"],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["retain the complete accepted filter tree","replace only the grouping with ticker","validate the full query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted filtered query","same server-authorized account scope","Category 12-valid predicate tree with explicit precedence","Category 11-authorized ticker grouping","compatible metric basis population counts and coverage","no filter converted into a grouping"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters retain predicate meaning while grouping changes independently through its owner."},
  {"caseId":"C15-E16-17","caseType":"multi_part","input":"For the accepted net P and L summary, group by ticker, keep the validated June period, and present the unchanged result in a table.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["grouping_modification","net_pnl","detail_modification"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["replace the accepted grouping with ticker","retain the accepted June temporal contract","apply table presentation only after full-query validation"],"expectedComparison":null,"expectedTimeRange":"retained Category 13-resolved June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted net P and L query","same server-authorized account scope","Category 11 ticker grouping and Category 18 table mode","net P and L equals gross P and L minus allocated charge_cost plus allocated charge_credit","fee-complete conserving allocation compatible currency sample and coverage","atomic validation of every explicit delta"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping, time retention, and presentation remain separately owned and validate as one proposed revision."},
  {"caseId":"C15-E16-18","caseType":"ambiguous","input":"Separate those in the accepted result.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["accept clarification_needed outcome only","replace only the privacy-safe pending marker","leave accepted query revision unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one accepted result but unresolved grouping dimension","same server-authorized account scope","those could denote trades filters sides tickers or groups","pending marker supplies no grouping value","unchanged accepted query revision","no raw identifiers or private values"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which field should the accepted result be grouped by?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the grouping field first; grain, bucket version, missing behavior, and compatibility remain later validation stages."},
  {"caseId":"C15-E16-19","caseType":"negative_example","input":"Start a new summary grouped by weekday and do not reuse any prior accepted query state.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat as an explicit new question","accept clarification_needed for the unresolved summary metric","create only a privacy-safe pending marker and leave accepted query state unchanged","do not apply grouping_modification to prior state"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit new-question and no-reuse signal","same server-authorized account scope","requested weekday grouping remains only a proposed Category 11 input until complete validation","summary metric remains unresolved and the pending marker supplies no accepted metric or grouping value","prior accepted query supplies no default and remains unchanged","new population time metric basis and coverage validation remains staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which metric should the new weekday-grouped summary use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the requested summary measure first; then validate the new grouping, population, time, metric basis, and coverage without reusing or mutating prior accepted state."},
  {"caseId":"C15-E16-20","caseType":"unsupported_data","input":"Group the accepted result by hidden broker identifiers from another account and infer any missing buckets.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["grouping_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject unauthorized and invented grouping","update neither accepted query nor pending ambiguity"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized account scope","Category 11-approved dimensions only","no cross-account or hidden broker identifiers","no inferred missing buckets or raw IDs","unsupported request supplies no grouping value","prior accepted revision remains unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A grouping cannot use another account's private identifiers, hidden broker values, or invented missing buckets.","notes":"Fail closed without revealing whether another account or hidden identifier exists."},
  {"caseId":"C15-E16-21","caseType":"selected_entity_context","input":"For the accepted selected-trade analysis, group only its authorized supporting trades by ticker without exposing any identifier.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["grouping_modification","selected_trade"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups for the accepted supporting-trade population"],"expectedOperators":["resolve the selected trade from trusted typed context","add only the validated ticker grouping","validate the complete selected-trade query atomically"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade in the authorized account","expectedContextRequirements":["one unique compatible accepted selected-trade query","trusted typed selected trade with current same-account ownership provenance lifecycle and coverage","Category 11-authorized ticker grouping","accepted supporting-trade population and metric remain unchanged","no raw identifier or prose-derived selection","stale or nonunique selection leaves state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context identifies the accepted query only; grouping remains authorized, typed, and privacy safe."},
  {"caseId":"C15-E16-22","caseType":"cross_category","input":"For the accepted June net P and L comparison, group both sides by ticker while preserving exact fee, currency, count, and coverage contracts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate"],"expectedCanonicalConcepts":["grouping_modification","active_comparison","net_pnl"],"expectedFilters":[],"expectedGroupings":["authorized ticker groups applied consistently to both accepted sides"],"expectedOperators":["add the explicit compatible ticker grouping to both sides","preserve the accepted comparison contract","validate all dependent fields before atomic acceptance"],"expectedComparison":"retained accepted sides with signed left-minus-right net P and L difference, absolute magnitude, and fixed equality","expectedTimeRange":"retained Category 13-resolved June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","net P and L equals gross P and L minus allocated charge_cost plus allocated charge_credit on each side","fee-complete conserving allocations compatible currency and side-specific populations","Category 11 ticker definition shared across sides","exact counts exclusions partial or unavailable coverage and no causal claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping cannot change either side's accepted financial, temporal, population, or comparison truth."}
]
~~~

## Evaluation Array C15-E17 -- detail_modification

~~~json
[
  {"caseId":"C15-E17-01","caseType":"canonical","input":"Give me more detail about the uniquely identified accepted result without changing its calculation or facts.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted query and result snapshot","apply Category 18 detailed response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query result and factual snapshot revision","same server-authorized account scope","Category 18 detailed response mode","unchanged intent metric population sample counts filters time grouping comparison basis fees currency coverage and limitations","authorization-safe bounded evidence only","no hidden reasoning causal claim or recalculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Detail changes presentation and bounded evidence depth only; analytical truth stays immutable."},
  {"caseId":"C15-E17-02","caseType":"formal_paraphrase","input":"Render the referenced accepted analysis in audit mode while preserving its exact query contract and factual snapshot.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted query and result snapshot","apply Category 18 audit response mode only","preserve material coverage and limitation disclosures"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted query result and snapshot revision","same server-authorized account scope","Category 18 audit mode","unchanged formula unit basis denominator population exact values sample counts fees currency coverage and limitations","current authorization for bounded evidence references","no raw IDs private evidence or hidden chain of thought"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Audit presentation can expose only authorized evidence references already supporting the accepted snapshot."},
  {"caseId":"C15-E17-03","caseType":"conversational_paraphrase","input":"Show me the same accepted answer, just with the supporting trades that were already authorized.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted result contract","expand only to bounded authorized supporting evidence"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result and snapshot revision","same server-authorized account scope","Category 18 detailed or audit evidence mode","supporting trades already within the accepted population and coverage","current record-level authorization and privacy validation","no new retrieval population raw IDs or query mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Show the trades means bounded evidence for the accepted result, never an unrestricted or newly calculated record query."},
  {"caseId":"C15-E17-04","caseType":"trader_slang","input":"Same accepted numbers; give me the quick coach-style read without changing the evidence.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted result contract","apply Category 18 coach response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result","same server-authorized account scope","Category 18 coach presentation mode","unchanged facts metric population counts coverage and limitations","no new causal inference advice prediction or recommendation","no hidden reasoning"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Coach-style presentation remains factual and cannot become personalized trading advice."},
  {"caseId":"C15-E17-05","caseType":"abbreviation","input":"Use std detail for that accepted result and retain the exact fee-complete net basis.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted result contract","apply Category 18 standard response mode only","preserve the accepted net fee basis"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result","same server-authorized account scope","Category 18 standard mode","unchanged net formula fee completeness charge costs credits allocation currency population counts and coverage","abbreviation supplies no new metric or evidence","no recalculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation changes only presentation; material fee limitations remain visible."},
  {"caseId":"C15-E17-06","caseType":"misspelling","input":"Explain how the accepted result was calclated using its unchanged formula and sample.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted result snapshot","restate only the accepted deterministic formula and evidence contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result and snapshot revision","same server-authorized account scope","accepted metric formula unit basis denominator population and sample counts","unchanged fee currency coverage and limitations","misspelling normalization only","no hidden reasoning or alternative calculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain calculation means a factual formula restatement, not disclosure of hidden reasoning."},
  {"caseId":"C15-E17-07","caseType":"noisy_input","input":"same accepted facts... table view pls, no rerun, no extra rows","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted query and result snapshot","apply Category 18 table response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result","same server-authorized account scope","Category 18 table mode","unchanged row population sort grouping values counts coverage and limitations","noise creates no query delta or evidence expansion","no recalculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Table mode rearranges accepted facts only and cannot create grouping, ranking, or new rows."},
  {"caseId":"C15-E17-08","caseType":"command","input":"Explain the accepted net P and L result in detail and preserve its exact costs, credits, currency, and coverage.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted net P and L result","apply Category 18 detailed response mode","restate only the accepted formula and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted net P and L result and snapshot","same server-authorized account scope","net P and L equals gross P and L minus allocated charge_cost plus allocated charge_credit","fee-complete conserving allocation compatible recorded currency","unchanged eligible population exact counts partial or unavailable coverage","no alternate basis cause advice or hidden reasoning"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An imperative explanation remains limited to the accepted deterministic financial contract."},
  {"caseId":"C15-E17-09","caseType":"fragment","input":"that accepted answer, brief mode, same facts and limitations","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted result contract","apply Category 18 brief response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result","same server-authorized account scope","Category 18 brief mode","unchanged metric population values counts coverage and material limitations","fragment supplies no missing target or mode beyond explicit brief","no recalculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Brief mode may shorten optional prose but cannot omit material coverage or unavailability."},
  {"caseId":"C15-E17-10","caseType":"follow_up","input":"For that uniquely referenced accepted result, explain how you calculated it without changing the snapshot.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted query result and snapshot","restate the accepted deterministic formula and evidence only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result reference","same server-authorized account scope","accepted query and factual snapshot revisions","exact metric formula basis denominator population values counts fees currency coverage and limitations","current authorization for bounded evidence","no new analysis hidden reasoning or causal story"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explanation follows the immutable accepted snapshot rather than reconstructing truth from answer prose."},
  {"caseId":"C15-E17-11","caseType":"correction","input":"No, present the same accepted facts in a table; I did not ask for a ticker grouping or recalculation.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the contradicted presentation target with Category 18 table mode","do not add grouping","retain the immutable accepted result snapshot"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result","same server-authorized account scope","Category 18 table response mode","rejected grouping attempt did not mutate accepted query","unchanged rows values counts coverage and limitations","no hidden grouping or recalculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replaces only the presentation delta and preserves every analytical field."},
  {"caseId":"C15-E17-12","caseType":"comparison","input":"Explain the accepted two-side comparison in audit detail while preserving the exact sides, difference, counts, and coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["detail_modification","active_comparison"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted comparison result","apply Category 18 audit response mode only","restate accepted comparison evidence and limitations"],"expectedComparison":"retained accepted sides, metric, signed left-minus-right difference, absolute magnitude, and fixed equality","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result and snapshot","same server-authorized account scope","unchanged compatible side populations counts exclusions metric basis fees currency and coverage","authorization-safe evidence references","no percentage baseline cause or side change","no hidden reasoning"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Audit depth may show the accepted comparison contract but cannot reinterpret either side."},
  {"caseId":"C15-E17-13","caseType":"ranking","input":"Show the unchanged accepted ranking in detailed mode with the same metric, sort, limit, privacy-safe ties, and coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted ranking result","apply Category 18 detailed response mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted ranking result and snapshot","same server-authorized account scope","unchanged metric basis direction positive finite limit tie policy candidate counts exclusions and coverage","Category 18 detailed mode","no reorder larger candidate set or raw identifiers","no recalculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Detail cannot change ranking order, limit, tie treatment, or candidate population."},
  {"caseId":"C15-E17-14","caseType":"negation","input":"Do not rerun or reinterpret the accepted result; just give the brief answer with all material limitations.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted query result and snapshot","apply Category 18 brief mode only","preserve material limitation disclosures"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result","same server-authorized account scope","Category 18 brief mode","unchanged facts formula population counts coverage safety and authorization","no recalculation reinterpretation or hidden analysis","partial or unavailable state remains explicit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation scopes the response delta and cannot suppress required evidence limitations."},
  {"caseId":"C15-E17-15","caseType":"exclusion","input":"Use detailed mode for the accepted answer but leave optional coaching language out and retain every required disclosure.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted result contract","apply Category 18 detailed mode","omit only optional coaching presentation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted result","same server-authorized account scope","Category 18 detailed mode","unchanged factual snapshot metric population counts coverage and limitations","material fee privacy safety and unavailability disclosures retained","no advice or new analysis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A presentation exclusion cannot remove facts, coverage, warnings, or limitations required for truth."},
  {"caseId":"C15-E17-16","caseType":"multi_filter","input":"Keep the accepted long-side and morning-session result unchanged, then show its authorized evidence in audit detail.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification","active_filters"],"expectedFilters":["retained accepted long-side predicate","retained accepted morning-session predicate"],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted filtered result","apply Category 18 audit mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted filtered result and snapshot","same server-authorized account scope","unchanged Category 12 predicate tree population values counts and coverage","Category 18 audit mode","record-level authorization for bounded evidence","no new rows filter change or private identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Audit detail stays inside the accepted filter population and current evidence permissions."},
  {"caseId":"C15-E17-17","caseType":"multi_part","input":"Explain the accepted June net P and L result in detail, show its exact fee formula, and preserve the same sample and coverage.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted June result and snapshot","apply Category 18 detailed mode","restate the accepted net formula sample and coverage only"],"expectedComparison":null,"expectedTimeRange":"retained Category 13-resolved June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted net P and L result","same server-authorized account scope","net P and L equals gross P and L minus allocated charge_cost plus allocated charge_credit","fee-complete conserving allocation compatible recorded currency","unchanged eligible population exact sample exclusions and partial or unavailable coverage","no new calculation cause advice or hidden reasoning"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All requested detail restates the accepted financial and coverage contract without altering it."},
  {"caseId":"C15-E17-18","caseType":"ambiguous","input":"Give me more on that accepted answer.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["accept clarification_needed outcome only","replace only the privacy-safe pending marker","leave accepted query and result revisions unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one accepted answer but unresolved presentation or evidence depth","same server-authorized account scope","more could mean detailed explanation table evidence or a new analysis","pending marker supplies no response mode or query delta","accepted query result and snapshot remain unchanged","no raw IDs private values or hidden reasoning"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Would you like more explanation, a table, or the already-authorized supporting evidence?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the response mode first; any evidence access is separately revalidated after that answer."},
  {"caseId":"C15-E17-19","caseType":"negative_example","input":"Run a new calculation on a different population instead of explaining my prior accepted answer.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat as an explicit new question","accept clarification_needed for the unresolved calculation metric","create only a privacy-safe pending marker and leave accepted query and result state unchanged","do not apply detail_modification to prior state"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit new-calculation and no-explanation signal","same server-authorized account scope","requested metric remains unresolved and the pending marker supplies no accepted metric or value","prior accepted query result and snapshot supply no defaults and remain unchanged","new population time metric basis sample and coverage validation remains staged","no hidden calculation inferred from detail language"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which metric should the new calculation use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the requested metric first; then validate the new population, time, basis, sample, and coverage without reusing or mutating the prior accepted result."},
  {"caseId":"C15-E17-20","caseType":"unsupported_data","input":"Show hidden reasoning and raw private broker records from another account as detail for this accepted answer.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["detail_modification"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject hidden-reasoning and unauthorized evidence request","update neither accepted query nor pending ambiguity"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized account scope","no hidden chain of thought","no cross-account or unrestricted private evidence","no raw broker identifiers or records","bounded authorized evidence only","accepted query result and snapshot remain unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Response detail cannot reveal hidden reasoning, raw identifiers, or another account's private broker evidence.","notes":"Fail closed without confirming whether other-account records or hidden reasoning exist."},
  {"caseId":"C15-E17-21","caseType":"selected_entity_context","input":"Explain the accepted selected trade in detail using only its current authorized evidence and no raw identifier.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["detail_modification","selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the selected trade from trusted typed context","retain the immutable accepted selected-trade result","apply Category 18 detailed mode only"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade in the authorized account","expectedContextRequirements":["one unique accepted selected-trade result and snapshot","trusted typed selection with current same-account ownership provenance lifecycle and coverage","unchanged metric population values counts fees currency and limitations","current authorization for bounded evidence","no raw identifier private notes beyond accepted evidence or hidden reasoning","stale or nonunique selection leaves state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context identifies the immutable accepted result; detail never broadens its evidence scope."},
  {"caseId":"C15-E17-22","caseType":"cross_category","input":"Explain the accepted two-side net expectancy result in audit detail while preserving separate denominators, fees, counts, and coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["detail_modification","active_comparison","expectancy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the immutable accepted comparison result and snapshot","apply Category 18 audit mode only","restate the accepted formulas evidence and limitations"],"expectedComparison":"retained accepted sides with signed left-minus-right net-expectancy difference, absolute magnitude, and fixed equality","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","each side sum of gross P and L minus allocated charge_cost plus allocated charge_credit divided by its own eligible ready-closed count","fee-complete conserving allocations compatible currency and nonzero own-side denominators","side-specific unavailable result when denominator or fee coverage fails","unchanged exact side samples exclusions coverage and no causal claim or hidden reasoning"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Audit detail restates the accepted side-specific metric and evidence contract without recalculation or causal interpretation."}
]
~~~

## Evaluation Array C15-E18 -- comparison_continuation

~~~json
[
  {"caseId":"C15-E18-01","caseType":"canonical","input":"For the uniquely identified accepted comparison, which side has the lower accepted standard deviation?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["comparison_continuation","metric_modification","standard_deviation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted comparison sides and result snapshot","apply the explicitly requested locked standard_deviation metric","validate any metric delta before atomic acceptance"],"expectedComparison":"retained accepted sides with lower standard deviation determined from exact side values, fixed equality, and no causal claim","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique compatible accepted comparison query result and factual snapshot revision","same server-authorized account scope","exact accepted side definitions compatible eligible populations and exclusions","Category 4-owned standard deviation population convention and units","side-specific sample counts coverage and limitations","no hidden side metric basis threshold percentage or cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A new comparison metric is explicit and owner-validated; the accepted sides never change by implication."},
  {"caseId":"C15-E18-02","caseType":"formal_paraphrase","input":"Continue the referenced accepted two-side result by reassessing its exact eligible counts under the locked sample-adequacy policy.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted comparison sides and result snapshot","revalidate exact side populations counts exclusions and coverage","defer adequacy interpretation to the locked metric or policy owner"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result and snapshot revision","same server-authorized account scope","identical accepted side definitions metric basis units and lifecycle eligibility","current exact eligible side counts exclusions and coverage","locked metric-specific or policy-specific adequacy threshold","no universal threshold hidden default or causal conclusion"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The continuation reports exact current counts and only the owning contract may interpret adequacy."},
  {"caseId":"C15-E18-03","caseType":"conversational_paraphrase","input":"On that accepted comparison, is the sample big enough under its existing metric policy?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted comparison sides and result snapshot","revalidate side-specific eligible counts and coverage","apply only the locked owning adequacy policy if one exists"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","unchanged side populations metric basis units exclusions and lifecycle rules","current exact eligible side counts and coverage","locked owner threshold or explicit unavailable adequacy interpretation","no guessed minimum or pooled side count"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Natural sample language cannot create a universal adequacy threshold or change the accepted population."},
  {"caseId":"C15-E18-04","caseType":"trader_slang","input":"Same accepted matchup: which side is steadier on the explicitly requested standard-deviation measure?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["comparison_continuation","metric_modification","standard_deviation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted sides","apply the explicit locked standard_deviation metric","validate the continuation against the accepted snapshot"],"expectedComparison":"retained accepted sides with lower standard deviation identified from exact compatible values and fixed equality","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","Category 4 population-standard-deviation contract and compatible units","unchanged side definitions eligible populations exclusions and coverage","side-specific exact sample counts and limitations","slang supplies no cause ranking or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Steadier normalizes only to an explicit accepted metric owner, never a vague favorable-side judgment."},
  {"caseId":"C15-E18-05","caseType":"abbreviation","input":"For that accepted comparison, recheck each side's n and coverage under the locked policy.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted sides and snapshot","revalidate each side's exact eligible count and coverage","defer adequacy meaning to the locked owner"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","n normalized only to side-specific eligible sample count","unchanged metric basis populations exclusions and lifecycle rules","locked metric or policy threshold if available","no pooled count guessed threshold or private identifier"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The abbreviation identifies a count only; it does not decide adequacy."},
  {"caseId":"C15-E18-06","caseType":"misspelling","input":"For the accepted two-side result, is the smaple adequate under its locked metric policy?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted comparison result","revalidate side populations counts exclusions and coverage","apply only the locked adequacy owner"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","misspelling normalization only","unchanged side definitions metric basis and lifecycle eligibility","exact side-specific counts exclusions coverage and limitations","no inferred adequacy threshold"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Misspelling tolerance cannot supply a missing sample policy or threshold."},
  {"caseId":"C15-E18-07","caseType":"noisy_input","input":"same accepted sides... why gap? only supported evidence, no guess pls","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted comparison and snapshot","report only supported direct mechanism bounded association or unknown cause","do not infer motive or causal explanation"],"expectedComparison":"retained accepted sides, result difference, counts, and coverage","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","unchanged side definitions metric basis populations counts exclusions and coverage","direct mechanism evidence required for causal wording","otherwise association-only or unknown-cause response","noise creates no cause new metric or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The safe answer states the evidence boundary and never turns a difference into causation."},
  {"caseId":"C15-E18-08","caseType":"command","input":"Continue the accepted comparison and report the exact side counts, exclusions, coverage, and locked-policy adequacy outcome.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted sides and result snapshot","revalidate exact side counts exclusions and coverage","apply only the locked owner adequacy rule"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","unchanged metric basis units side populations and lifecycle rules","current side-specific eligible counts exclusions and coverage","locked metric or policy threshold or explicit unavailable interpretation","no default threshold pooled count cause or recommendation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A command cannot override the owner of sample adequacy or the accepted result contract."},
  {"caseId":"C15-E18-09","caseType":"fragment","input":"that accepted comparison, same sides, sample adequacy under the locked owner","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted comparison result","revalidate side-specific sample evidence","defer adequacy interpretation to the locked owner"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","fragment resolves to exact accepted sides only through trusted state","unchanged metric basis populations counts exclusions and coverage","locked adequacy policy if present","no inferred threshold or new question fields"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is resolvable only from one exact accepted comparison and its immutable snapshot."},
  {"caseId":"C15-E18-10","caseType":"follow_up","input":"For that uniquely referenced accepted comparison, what supported evidence explains the recorded difference?","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted sides result and snapshot","inspect only authorized evidence already supporting the comparison","return direct mechanism bounded association or unknown cause"],"expectedComparison":"retained accepted sides and recorded difference","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result and snapshot","same server-authorized account scope","unchanged side populations metric basis counts exclusions coverage and limitations","current authorization for bounded supporting evidence","causal language requires direct mechanism evidence","no motive hidden reasoning private evidence or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The continuation may explain evidence boundaries but cannot manufacture why from a numerical gap."},
  {"caseId":"C15-E18-11","caseType":"correction","input":"No, keep the accepted sides and result; I only want each side's exact eligible count, not a new comparison.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["replace the contradicted new-comparison interpretation with sample continuation","retain the exact accepted comparison result","revalidate side-specific eligible counts and coverage"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","explicit correction target","unchanged sides metric basis populations exclusions and snapshot","current exact side counts and coverage","rejected interpretation did not mutate accepted state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replaces only the continuation kind and preserves every accepted comparison field."},
  {"caseId":"C15-E18-12","caseType":"comparison","input":"Within the accepted comparison, use the exact existing side values to state which is higher and preserve equality as equality.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted sides metric and snapshot","compare the accepted compatible values","preserve fixed equality and signed difference meaning"],"expectedComparison":"retained accepted sides with signed left-minus-right difference, absolute magnitude, and fixed equality","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","unchanged compatible side populations metric units basis fees currency and counts","accepted exact side values and coverage","no percentage unless separately owner-explicit baseline is valid","no causal or favorable-side inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The continuation reads the accepted comparison truth; it does not recompute or redefine higher."},
  {"caseId":"C15-E18-13","caseType":"ranking","input":"For the accepted two-side result only, identify the lower standard-deviation side without turning it into a broader ranking.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["comparison_continuation","metric_modification","standard_deviation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain exactly the two accepted sides","apply the explicit locked standard_deviation metric","do not create a candidate ranking or result limit"],"expectedComparison":"retained accepted sides with lower standard deviation and fixed equality","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted two-side result","same server-authorized account scope","Category 4 population-standard-deviation contract","unchanged compatible side populations exact counts exclusions and coverage","no Category 14 candidate set sort limit or tie policy","no causal conclusion"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Which side is a two-side continuation, not permission to rank a larger candidate set."},
  {"caseId":"C15-E18-14","caseType":"negation","input":"Do not change the accepted comparison or invent a cause; report only its exact side counts and coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted comparison result","revalidate exact side counts exclusions and coverage","exclude causal interpretation"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","unchanged sides metric basis population lifecycle and snapshot","current exact side-specific eligible counts exclusions and coverage","no cause motive hidden reasoning or recommendation","no implicit adequacy threshold"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation protects both the immutable result and the no-causation boundary."},
  {"caseId":"C15-E18-15","caseType":"exclusion","input":"Reassess the accepted comparison's sample using its original exclusions; do not admit unresolved or ineligible records.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted side populations and exclusions","revalidate eligible side counts and coverage","keep unresolved and ineligible records excluded and visible"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted comparison result","same server-authorized account scope","unchanged metric basis lifecycle and side definitions","original eligibility exclusions and needs_decision treatment","current exact eligible and excluded counts coverage and limitations","locked owner adequacy policy only"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Sample revalidation cannot convert excluded or unresolved evidence into facts."},
  {"caseId":"C15-E18-16","caseType":"multi_filter","input":"For the accepted long-versus-short comparison under five dollars, keep all predicates and revalidate each side's sample coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation","active_filters"],"expectedFilters":["retained accepted long-side predicate on the left","retained accepted short-side predicate on the right","retained accepted under-five-dollar predicate on both sides"],"expectedGroupings":[],"expectedOperators":["retain the complete accepted side-specific predicate trees","revalidate exact eligible side counts exclusions and coverage","apply only the locked adequacy owner"],"expectedComparison":"retained accepted long-versus-short sides and result","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted filtered comparison result","same server-authorized account scope","unchanged Category 12 predicate semantics and precedence","compatible side populations metric basis units and lifecycle rules","exact side-specific counts exclusions and coverage","no pooled sample threshold or cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Continuation revalidates samples inside the exact accepted predicates and never rewrites them."},
  {"caseId":"C15-E18-17","caseType":"multi_part","input":"For the accepted June comparison, keep both sides unchanged, report exact counts and coverage, and explain any adequacy outcome only under the locked policy.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted sides period result and snapshot","revalidate side counts exclusions and coverage","apply and explain only the locked adequacy owner"],"expectedComparison":"retained accepted two-side comparison contract","expectedTimeRange":"retained Category 13-resolved June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted June comparison result","same server-authorized account scope","unchanged side definitions metric basis units fees currency and lifecycle populations","current exact side-specific counts exclusions coverage and limitations","locked metric or policy threshold or explicit unavailable interpretation","no cause new side percentage or recommendation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Every continuation part stays attached to the same immutable accepted result and locked policy."},
  {"caseId":"C15-E18-18","caseType":"ambiguous","input":"For that accepted comparison, is the sample enough?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["accept clarification_needed outcome only","replace only the privacy-safe pending marker","leave accepted comparison and result revisions unchanged"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["multiple or missing compatible accepted comparison candidates","same server-authorized account scope","sample must resolve to one exact comparison result before count revalidation","pending marker supplies no side count policy threshold or comparison value","accepted query result and snapshot remain unchanged","no raw IDs or private values"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which accepted comparison do you want the sample checked for?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the accepted comparison target first; exact counts and any owner threshold are later validated stages."},
  {"caseId":"C15-E18-19","caseType":"negative_example","input":"Start a new comparison between morning and afternoon trades and do not reuse any prior accepted sides or result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat as an explicit new comparison question","accept clarification_needed for the unresolved comparison metric","create only a privacy-safe pending marker and leave accepted comparison query and result state unchanged","do not apply comparison_continuation to prior state"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit new-question and no-reuse signal","same server-authorized account scope","morning and afternoon remain only proposed sides until complete validation","requested comparison metric remains unresolved and the pending marker supplies no accepted metric side or value","prior accepted sides result and snapshot supply no defaults and remain unchanged","new session definitions time side populations metric basis fees currency and coverage validation remains staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which metric should the new morning-versus-afternoon comparison use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask only for the comparison metric first; then validate the session and time contracts, side populations, basis, fees, currency, and coverage without reusing prior accepted comparison state."},
  {"caseId":"C15-E18-20","caseType":"unsupported_data","input":"Explain the accepted difference using another account's private notes and hidden broker records as the cause.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["comparison_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-evidence and invented-cause request","update neither accepted query nor pending ambiguity"],"expectedComparison":"retained accepted comparison remains unchanged","expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["immutable server-authorized account scope","no cross-account notes hidden broker values or raw identifiers","direct mechanism evidence required for any causal statement","accepted sides result snapshot and coverage remain unchanged","unsupported attempt supplies no cause or comparison value","no hidden reasoning"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A comparison continuation cannot use another account's private evidence, hidden broker records, or invent a cause.","notes":"Fail closed without confirming whether other-account evidence exists."},
  {"caseId":"C15-E18-21","caseType":"selected_entity_context","input":"For the accepted comparison containing the trusted selected trade, revalidate the exact side counts without exposing its identifier.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation","selected_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the selected trade from trusted typed context","retain the exact accepted comparison result","revalidate side-specific eligible counts exclusions and coverage"],"expectedComparison":"retained accepted comparison sides containing the validated selected trade","expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected trade in the authorized account","expectedContextRequirements":["one unique accepted comparison result and snapshot","trusted typed selected trade with current same-account ownership provenance lifecycle and coverage","unchanged sides metric basis populations and exclusions","current exact side-specific counts and coverage","no raw identifier prose-derived selection or cross-account fallback","stale or nonunique selection leaves state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The selected trade may identify the accepted comparison only after current privacy-safe same-account validation."},
  {"caseId":"C15-E18-22","caseType":"cross_category","input":"For the accepted current-versus-previous net expectancy result, preserve both periods and report exact side samples before applying any locked adequacy rule.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["comparison_continuation","current_versus_previous","expectancy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain the exact accepted current and previous sides result and snapshot","revalidate separate eligible side counts exclusions and coverage","apply only an explicit locked owner adequacy rule"],"expectedComparison":"retained accepted current-minus-previous net-expectancy difference, absolute magnitude, and fixed equality","expectedTimeRange":"retained separately Category 13-resolved current and previous periods with explicit event basis timezone and endpoints","expectedSelectedEntity":null,"expectedContextRequirements":["one unique accepted current-versus-previous comparison result","same server-authorized account scope","each side sum of gross P and L minus allocated charge_cost plus allocated charge_credit divided by its own eligible ready-closed count","fee-complete conserving allocations compatible currency and nonzero own-side denominators","side-specific unavailable result for zero denominator or incomplete fee coverage","exact samples exclusions coverage no implicit percentage baseline and no causal claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Temporal, metric, fee, denominator, comparison, sample, and adequacy owners remain exact and separate."}
]
~~~

---

# 8. Coverage Report Deliverable

Final Version 1 approved-and-locked coverage: PASS.

- Canonical inventory: 18/18 records independently reviewed/PASS.
- Language registries: 18/18 registries independently reviewed/PASS.
- Evaluation arrays saved: 18/18 (`C15-E1` through `C15-E18`).
- Evaluation cases: 396/396 independently reviewed/PASS; 0 failed, unreviewed,
  undrafted, or pending.
- Standard case-type structure: 22/22 ordered types are present in each saved
  array.
- Planned-state count: 396 `Planned`, 0 other statuses.
- Focused-clarification cases: 22; each asks only the first material field
  and leaves accepted query state unchanged.
- Unsupported cases: 18; cross-account/stale intent, metric, time, filter,
  comparison, grouping, trade, ticker, Journal-entry reconstruction, account
  union, response-mode escalation, and unsafe ambiguity resolution fail closed
  without raw identifiers, private content, invented structured state, or runtime claims.
- Cross-category cases: 18; intent, metric, time, grouping, filter,
  selection, linkage, privacy, and presentation owners remain separate.
- Non-empty `expectedSecondaryIntents`: 102.
- Non-null `expectedSelectedEntity`: 72; every selected entity requires trusted
  server validation in the same authorized account and exposes no raw identifier.
- Non-null `expectedTimeRange`: 94; no date, timezone, event basis, endpoint,
  or prior state value is invented.
- Non-null `expectedComparison`: 62; every comparison retains or independently
  validates exact sides, metric/basis, populations, counts, coverage, and limits.
- `confirmationExpected: true`: 0.
- Non-null `expectedProtectedAction`: 0.
- Gaps: none. Version 1 deliverable production, independent review, approval,
  locks, master synchronization, and Category Complete are all recorded.
- Overlap review: PASS; context retention, field modification, presentation,
  comparison continuation, and new-question boundaries remain distinct.
- Overall Version 1 evaluation and coverage: PASS.
- Runtime status: none. This final locked coverage report authorizes no resolver,
  parser, query execution, provider call, data access, write, or production use.

---

# 9. Acceptance Checklist

## Planning

- [x] Purpose is complete for the approved Version 1 inventory.
- [x] Boundaries are complete for the approved Version 1 inventory.
- [x] Dependencies are documented.
- [x] Risks are documented.
- [x] Planning questions are answered.

## Controlling Inventory

- [x] Complete proposed canonical concept list exists.
- [x] Controlling-inventory statement is present.
- [x] No listed source item was silently omitted.
- [x] No listed source item was silently renamed.
- [x] No listed source item was silently merged.
- [x] Proposed additions are separated.
- [x] Duplicate-concept review is recorded for controller review.

## Canonical Inventory

- [x] Canonical Batches 1-3 have eighteen complete source-order records.
- [x] Every item has a complete canonical record.
- [x] Every exact canonical name is approved.
- [x] Every item has an exact definition.
- [x] Every record's related concepts are distinguished.
- [x] Classification, status, and version are present in every canonical record.

## Language Registry

- [x] Registry Batches 1-3 have eighteen complete source-order registries with all 38
  required subsections.
- [x] All eighteen complete language registries exist.
- [x] All eighteen exact language registries are approved.
- [x] All eighteen exact language registries are locked at Version 1.
- [x] Registry Batches 1-3 reference, pronoun, selected-context, follow-up, correction, ambiguity,
  negative, unsupported, authorization, privacy, and no-invention coverage is
  populated.

## Execution Requirements

- [x] Registry Batches 1-3 required/optional data, valid filters/groupings/operators,
  compatible exact locked intents, defaults, clarification, unsupported/tool,
  units, fees, open-trade, and sample contracts are populated.
- [x] Required and optional data are complete per registry.
- [x] Valid filters, groupings, operators, and compatible intents are complete.
- [x] Defaults, clarification conditions, unsupported conditions, and tool
  targets are complete.
- [x] Units, fees, open trades, sample size, selected context, accepted-state
  updates, and account isolation are complete per registry.

## Evaluation

- [x] Evaluation cases exist for every record and required case type.
- [x] Expected structured interpretations and state deltas are present.
- [x] Negative, ambiguous, unsupported, selected-entity, multi-turn,
  correction, account-isolation, and cross-category cases are tested.
- [x] Evaluation Batch 1 has 66 independently reviewed/PASS Version 1 cases
  across the first three source-order records, each with all 22 standard case
  types and ordered keys.
- [x] Evaluation Batch 2 has 66 independently reviewed/PASS Version 1 cases
  across the next three source-order records, each with all 22 standard case
  types and ordered keys.
- [x] Evaluation Batch 3 has 66 independently reviewed/PASS Version 1 cases
  across the next three source-order records, each with all 22 standard case
  types and ordered keys.
- [x] Evaluation Batch 4 has 66 independently reviewed/PASS Version 1 cases
  across the next three source-order records, each with all 22 standard case
  types and ordered keys.
- [x] Evaluation Batch 5 has 66 independently reviewed/PASS Version 1 cases
  across the next three source-order records, each with all 22 standard case
  types and ordered keys.
- [x] Evaluation Batch 6 has 66 independently reviewed/PASS Version 1 cases
  across the final three source-order records, each with all 22 standard case
  types and ordered keys.

## Coverage Report

- [x] Counts are complete for the final Version 1 approved-and-locked state.
- [x] Gaps are listed.
- [x] Overlaps are reviewed after deliverable production.
- [x] Unsupported capabilities are listed.
- [x] No unresolved blocker is hidden.

## Approval

- [x] Category reached Ready for Review.
- [x] Review changes are completed.
- [x] Canonical names are approved.
- [x] Canonical names are locked.
- [x] Version is updated.
- [x] Master tracker is updated for completion.
- [x] Initial planning change log is present.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- Planning review findings on pending-ambiguity atomicity and sample-size
  continuation were remediated.
- The lead controller accepted the exact 18-record source count, order,
  boundaries, and planning inventory on 2026-08-11 and authorized bounded
  canonical production.
- Canonical Batch 1 (`C15-CTX-001` through `C15-CTX-006`) independently PASSed
  and was controller-accepted on 2026-08-11; no name approval or lock is implied.
- Canonical Batch 2 (`C15-CTX-007` through `C15-CTX-012`) independently PASSed
  and was controller-accepted on 2026-08-11; no name approval or lock is implied.
- Canonical Batch 3 (`C15-CTX-013` through `C15-CTX-018`) independently PASSed
  and was controller-accepted on 2026-08-11; all 18 canonical records now PASS,
  without name approval or lock.
- Registry Batch 1 (`C15-CTX-001` through `C15-CTX-006`) independently PASSed
  after its focused clarification remediation and was controller-accepted on
  2026-08-11; no registry approval or lock is implied.
- Registry Batch 2 (`C15-CTX-007` through `C15-CTX-012`) independently PASSed
  and was controller-accepted on 2026-08-11; no registry approval or lock is implied.
- Registry Batch 3 (`C15-CTX-013` through `C15-CTX-018`) independently PASSed
  and was controller-accepted on 2026-08-11; all 18 registries now PASS, without
  registry approval or lock.
- Evaluation Batch 1 (`C15-E1` through `C15-E3`) independently PASSed and was
  controller-accepted on 2026-08-11; all 66 ordered Version 0 `Planned` cases
  remain unapproved and unlocked.
- Evaluation Batch 2 (`C15-E4` through `C15-E6`) independently PASSed
  after the two findings in `C15-E5-19` and `C15-E6-12` were remediated,
  and was controller-accepted on 2026-08-11. All 66 ordered Version 0
  `Planned` cases remain unapproved and unlocked.
- Evaluation Batch 3 (`C15-E7` through `C15-E9`) independently PASSed and was
  controller-accepted on 2026-08-11; all 66 ordered Version 0 `Planned` cases
  remain unapproved and unlocked.
- Evaluation Batch 3 review identified `C15-E9-12` as a
  `current_versus_previous` comparison rather than `before_versus_after`; its
  scoped contract was remediated and independently PASSed.
- Evaluation Batch 4 (`C15-E10` through `C15-E12`) independently PASSed and was
  controller-accepted on 2026-08-11; all 66 ordered Version 0 `Planned` cases
  remain unapproved and unlocked.
- Evaluation Batch 5 (`C15-E13` through `C15-E15`) independently PASSed after
  its five scoped residuals were remediated; all 66 ordered Version 0 `Planned`
  cases remain unapproved and unlocked. `C15-E1` through `C15-E15` now total
  330 reviewed/PASS cases.
- Evaluation Batch 5 review identified five scoped residuals: three obsolete
  retrieval intent tokens, one obsolete hold-duration metric token, and one
  wholly new win-rate query that required focused basis clarification
  instead of a resolved classification. All five were remediated and
  independently PASSed on re-review.
- Evaluation Batch 6 (`C15-E16` through `C15-E18`) independently PASSed after
  remediation and re-review. Its final 66 ordered Version 0 `Planned` cases
  cover grouping modification, detail modification, and comparison continuation
  without approval, lock, or runtime authorization.
- Evaluation Batch 6 review identified three wholly new negative examples that
  had resolved new-query fields without first clarifying the requested metric.
  `C15-E16-19`, `C15-E17-19`, and `C15-E18-19` now create only a privacy-safe
  `clarification_needed` pending marker, leave prior accepted state unchanged,
  and stage every remaining new-query contract for later validation; all three
  remediations independently PASSed on re-review with the rest of Batch 6.
- All six evaluation batches, 18 arrays, and 396 cases independently PASS.
  Overall Version 0 pre-lock evaluation and coverage PASS was recorded with exact final
  aggregates and no unresolved production or review gap.
- On 2026-08-11 the lead controller approved and locked all 18 exact canonical
  names and all 18 registries and promoted the category records to Version 1.
  Names, formulas, evaluation arrays, aggregates, `Planned` capability status,
  and the no-runtime boundary were preserved.
- Batch 1 structural follow-up moved the complete `C15-E2` heading and JSON
  array ahead of `C15-E3`, restoring exact `C15-E1`, `C15-E2`, `C15-E3`
  source order without changing either array payload or any workflow count.

## Required Changes

- None. Version 1 deliverable production, independent review, lead-controller
  approval, canonical-name/registry locking, master completion synchronization,
  and Category Complete are recorded. Runtime implementation remains
  unauthorized and is not a completion requirement for this Markdown inventory.

## Completed Changes

- Created Sections 1-4 from the twelve Stage 2 structured-state fields and six
  Section 12 follow-up families in exact source order.
- Recorded structured-state priority, two-track atomic accepted-query/pending-
  ambiguity updates, trusted UI
  context, reference/pronoun resolution, field corrections, new-question
  separation, explanation follow-ups, clarification, authorization, privacy,
  stale-context validation, and no-invention boundaries.
- Remediated planning review findings by separating accepted query state from a
  validator-accepted privacy-safe pending-ambiguity track, and by adding exact
  eligible-population, sample-count, coverage, and owning-threshold boundaries
  for sample-size continuations.
- Recorded controller acceptance of the exact 18-item planning inventory and
  authorization for bounded canonical production without approving or locking
  any name.
- Drafted the first six exact source-order Version 0 `Planned` canonical records
  with every required field and Related Concepts block.
- Recorded independent PASS and controller acceptance for Canonical Batch 1
  without approving or locking its names.
- Drafted the next six exact source-order Version 0 `Planned` canonical records,
  including trusted selected-object provenance/privacy, immutable account scope,
  response-mode ownership, accepted rank/basis ownership, and the exact
  two-track pending-ambiguity atomic contract.
- Remediated the remaining two-track ambiguity wording: a complete accepted
  clarification clears the marker and creates the next accepted revision; a
  still-ambiguous accepted `clarification_needed` result replaces only the
  marker; and a rejected, unsafe, unsupported, or unvalidated answer updates
  neither track.
- Recorded independent PASS and controller acceptance for Canonical Batch 2
  without approving or locking its names.
- Drafted the final six exact source-order Version 0 `Planned` canonical records
  for filter, time, metric, grouping, detail, and comparison follow-ups,
  completing 18/18 canonical drafts with explicit typed-delta ownership,
  accepted-revision provenance, correction replacement, unique reference
  resolution, sample/coverage revalidation, and no-invention boundaries.
- Recorded independent PASS and controller acceptance for Canonical Batch 3,
  bringing all 18 canonical records to reviewed/PASS without approving or
  locking their names.
- Drafted Registry Batch 1 for `C15-CTX-001` through `C15-CTX-006` with all 38
  required subsections each, exact locked Category 1 compatible intents,
  accepted-state/reference/clarification boundaries, realistic language and
  negative/unsupported cases, authorization/privacy, and no runtime claim.
- Remediated the `last_metric_or_metric_set` registry clarification residual by
  asking only which accepted metric should remain, staging any still-unresolved
  basis as a separate later focused question, and prohibiting basis inference.
- Recorded independent PASS and controller acceptance for Registry Batch 1
  without approving or locking its registries.
- Drafted Registry Batch 2 for `C15-CTX-007` through `C15-CTX-012` with all 38
  required subsections each, selected-object provenance/privacy, ticker-safe
  abbreviations, server-owned account isolation with no raw-account
  solicitation, Category 18 detail ownership, Category 14 sort/limit ownership,
  metric-basis ownership, and exact two-track ambiguity outcomes.
- Recorded independent PASS and controller acceptance for Registry Batch 2
  without approving or locking its registries.
- Drafted final Registry Batch 3 for `C15-CTX-013` through `C15-CTX-018` with all
  38 required subsections each, unique accepted targets/references, explicit
  owner-validated typed deltas, correction replacement, new-question separation,
  atomic/pending updates, exact sample/coverage continuation, explanation truth,
  authorization/privacy, and no causal/advisory/runtime inference.
- Recorded independent PASS and controller acceptance for Registry Batch 3,
  bringing all 18 registry drafts to reviewed/PASS without approving or locking
  them.
- Drafted Evaluation Batch 1 for `last_intent`,
  `last_metric_or_metric_set`, and `active_date_range`: 66 Version 0 `Planned`
  cases with the exact 22-type order and ordered 21-key schema, typed accepted-
  state provenance, owner-complete contracts, atomic ambiguity behavior,
  account isolation, selected context, coverage, privacy, and no-invention
  boundaries.
- Added truthful interim coverage while preserving Version 0, unapproved,
  unlocked, non-runtime status and recording that Batch 1 is unreviewed and 330
  cases remain pending.
- Restored Section 7 source order by mechanically moving the byte-equivalent
  `C15-E2` heading and JSON array before `C15-E3`; all 66 case payloads and
  workflow counts remain unchanged.
- Recorded independent PASS and controller acceptance for Evaluation Batch 1
  without approving or locking its cases or authorizing runtime behavior.
- Drafted Evaluation Batch 2 for `active_filters`, `active_comparison`, and
  `active_grouping`: 66 Version 0 `Planned` cases with the exact 22-type order
  and ordered 21-key schema, complete accepted predicate/comparison/grouping
  contracts, correction replacement without hidden accumulation, focused
  pending ambiguity, unique trusted references, account isolation, coverage,
  privacy, and no-invention boundaries.
- Updated truthful interim coverage to 6/18 arrays and 132/396 cases while
  preserving unapproved, unlocked, non-runtime status and recording Batch 2 as
  unreviewed with 264 cases still pending.
- Remediated the two scoped Evaluation Batch 2 review findings: `C15-E5-19`
  now states an explicit new gross-expectancy comparison with the locked
  expectancy concept, exact before-fee formula, compatible recorded-currency
  partition, side-specific denominator/unavailable rule, signed difference,
  magnitude, equality, counts, and coverage; `C15-E6-12` now preserves the
  accepted grouping while carrying the same exact per-group gross-expectancy
  contract. No other evaluation case changed.
- Recorded independent PASS and controller acceptance for Evaluation Batch 2,
  bringing `C15-E1` through `C15-E6` to 132 reviewed/PASS Version 0
  `Planned` cases without approval, locks, or runtime authorization.
- Drafted Evaluation Batch 3 for `selected_trade`, `selected_ticker`, and
  `selected_journal_entry`: 66 Version 0 `Planned` cases with the exact
  22-type order and ordered 21-key schema, unique natural inputs, exact locked
  Category 1 intents, trusted typed-selection provenance, same-account
  ownership/type/current-coverage revalidation, exact ticker preservation,
  lifecycle and decision coverage, Journal content minimization, focused
  ambiguity, privacy, and no-invention boundaries.
- Updated truthful interim coverage to 9/18 arrays and 198/396 cases while
  preserving unapproved, unlocked, non-runtime status and recording Batch 3 as
  unreviewed with 198 cases still pending.
- Remediated only `C15-E9-12` to use the exact
  `current_versus_previous` contract: Category 13-resolved current and
  previous periods with explicit event basis, timezone, and endpoints;
  compatible side populations, metric, basis, fees, and currency; signed
  current-minus-previous difference, absolute magnitude, fixed equality, no
  implicit percentage baseline, exact side counts/coverage, selected-entry
  provenance/privacy, and no causal claim.
- Recorded independent PASS and controller acceptance for Evaluation Batch 3,
  bringing `C15-E1` through `C15-E9` to 198 reviewed/PASS Version 0 `Planned`
  cases without approval, locks, or runtime authorization.
- Drafted Evaluation Batch 4 for `current_account`, `response_detail_level`,
  and `unresolved_ambiguity`: 66 Version 0 `Planned` cases with the exact
  22-type order and ordered 21-key schema, immutable server-owned one-account
  conversation scope, Category 18 presentation-only response modes, exact
  two-track complete/still-ambiguous/rejected clarification outcomes, focused
  questions, privacy, and no invention or runtime claim.
- Updated truthful interim coverage to 12/18 arrays and 264/396 cases while
  preserving unapproved, unlocked, non-runtime status and recording Batch 4 as
  unreviewed with 132 cases still pending.
- Recorded independent PASS and controller acceptance for Evaluation Batch 4,
  bringing `C15-E1` through `C15-E12` to 264 reviewed/PASS Version 0 `Planned`
  cases without approval, locks, or runtime authorization.
- Drafted Evaluation Batch 5 for `filter_modification`, `time_modification`, and
  `metric_modification`: 66 Version 0 `Planned` cases with the exact 22-type
  order and ordered 21-key schema, unique natural inputs, exact locked Category
  1 intents, unique compatible accepted-query targeting, owner-validated typed
  deltas, correction replacement without hidden accumulation, atomic full-query
  acceptance, focused pending ambiguity, Category 12 filter semantics, Category
  13 temporal resolution, locked metric formulas and dependencies, privacy, and
  no invention, advice, cause, mutation, or runtime claim.
- Updated truthful interim coverage to 15/18 arrays and 330/396 cases while
  preserving unapproved, unlocked, non-runtime status and recording Batch 5 as
  unreviewed with 66 cases still pending.
- Remediated only the five scoped Evaluation Batch 5 findings: changed
  `C15-E13-08`, `C15-E13-19`, and `C15-E13-21` to the locked
  `retrieve_records` intent; changed `C15-E15-15` to the locked
  `average_hold_duration` token; and changed `C15-E15-19` to a wholly new
  win-rate query with one focused gross-before-fee versus fee-complete-net
  classification question, privacy-safe pending state, unchanged accepted
  state, and later Category 13 time/population/sample/coverage validation.
- Recorded independent PASS for Evaluation Batch 5, bringing `C15-E1` through
  `C15-E15` to 330 reviewed/PASS Version 0 `Planned` cases without approval,
  locks, or runtime authorization.
- Drafted final Evaluation Batch 6 for `grouping_modification`,
  `detail_modification`, and `comparison_continuation`: 66 Version 0 `Planned`
  cases with exact 22-type order and ordered 21-key schema, globally distinct
  natural inputs, exact locked Category 1 intents, unique accepted targets,
  Category 11-owned grouping deltas, Category 18 presentation-only detail,
  immutable query/result/snapshot provenance, exact comparison sides and
  samples, locked-owner adequacy thresholds, correction replacement, focused
  ambiguity, privacy, and no raw IDs, cause invention, advice, or runtime claim.
- Updated truthful interim production coverage to 18/18 arrays and 396/396
  cases: 330 independently reviewed/PASS, 66 awaiting independent review, and
  0 undrafted, while preserving unapproved, unlocked, non-runtime status.
- Remediated the three Evaluation Batch 6 new-question residuals:
  `C15-E16-19` now asks only for the new grouped summary's metric before later
  population/time/basis/coverage validation; `C15-E17-19` asks only for the new
  calculation metric before later population/time/basis/sample/coverage
  validation; and `C15-E18-19` asks only for the new comparison metric before
  later session/time/side-population/basis/fee/currency/coverage validation.
  Each uses only a privacy-safe pending marker and leaves all accepted query,
  result, snapshot, and comparison state unchanged.
- Recorded independent PASS for Evaluation Batch 6 after scoped remediation,
  bringing all six batches, 18 arrays, and 396 Version 0 `Planned` cases to
  reviewed/PASS with 0 failed, unreviewed, undrafted, or pending.
- Reconciled final Version 0 coverage aggregates: 22 clarification, 18
  unsupported, 18 cross-category, 102 non-empty secondary-intent, 72 selected-
  entity, 94 temporal, 62 comparison, 0 confirmation, and 0 protected-action
  cases. Recorded overall evaluation/coverage PASS and advanced the category to
  Ready for Review without approval, locks, Version 1 promotion, master
  completion, or runtime authorization.
- Recorded lead-controller approval dated 2026-08-11, locked all 18 exact
  canonical names and all 18 registries, and promoted metadata plus all 18
  canonical records to Version 1. Preserved all exact names, formulas,
  evaluation arrays, aggregates, `Planned` statuses, and the no-runtime
  boundary; left only master completion synchronization and Category Complete
  pending.
- Synchronized the master tracker's Complete Version 1 and locked state, closed
  the final two checklist gates, and marked Category 15 Complete while
  preserving all 18 approved/locked canonical names and registries, formulas,
  396 passed cases, exact aggregates, `Planned` capability statuses, and the
  no-runtime boundary.

## Approval Decision

- Status: Complete Version 1; master-synchronized and locked. All 18 canonical records, all 18 language
  registries, all six evaluation batches, all 18 arrays, and all 396 Version 1
  `Planned` cases independently PASS. There are 0 failed, unreviewed,
  undrafted, or pending cases. Overall Version 1 evaluation and coverage PASS
  is recorded.
- Approved by: Lead controller.
- Approval date: 2026-08-11.
- Version: 1.
- Canonical names approved: Yes, all 18 exact names.
- Canonical names locked: Yes, all 18 exact names.
- Language registries approved: Yes, all 18 registries.
- Language registries locked: Yes, all 18 registries.
- Master tracker synchronized: Yes; Category 15 is Complete Version 1 and locked.
- Capability status: Planned; no runtime authorization.

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-11 | Initial Version 0 planning/inventory draft created | Preserve the twelve Stage 2 structured conversation-state fields and six Section 12 follow-up families in exact source order, with accepted-state, trusted-context, correction, clarification, account-isolation, privacy, and no-invention boundaries before canonical production | 0 |
| 2026-08-11 | Remediated pending-ambiguity atomicity and sample-size continuation boundaries | Keep accepted query revisions immutable during clarification, allow only a validator-accepted privacy-safe pending marker, require atomic clarification acceptance, and preserve exact eligible sample counts/population/coverage under owning metric/policy thresholds | 0 |
| 2026-08-11 | Controller accepted the exact 18-item planning inventory; drafted Canonical Batch 1 | Advance only `C15-CTX-001` through `C15-CTX-006` with complete Version 0 `Planned` canonical records while keeping names unapproved/unlocked, records 007-018 and Sections 6-8 deferred, and runtime unauthorized | 0 |
| 2026-08-11 | Canonical Batch 1 independently passed and was controller-accepted; drafted Canonical Batch 2 | Advance only `C15-CTX-007` through `C15-CTX-012` with complete Version 0 `Planned` records preserving selected-object provenance/privacy, account isolation, response-mode ownership, rank/basis ownership, and two-track ambiguity atomicity while records 013-018 and Sections 6-8 remain deferred | 0 |
| 2026-08-11 | Remediated Canonical Batch 2 two-track atomicity residual | Separate complete accepted clarification, still-ambiguous accepted `clarification_needed`, and rejected/unsafe/unsupported/unvalidated answer outcomes so marker replacement never also advances accepted query state | 0 |
| 2026-08-11 | Canonical Batch 2 independently passed and was controller-accepted; drafted final Canonical Batch 3 | Complete `C15-CTX-013` through `C15-CTX-018` as Version 0 `Planned` follow-up records with explicit field-delta ownership, accepted-revision provenance, correction replacement, unique reference resolution, exact sample/coverage continuation, and explanation-truth boundaries while registries, evaluations, coverage, approval, locks, and runtime remain deferred | 0 |
| 2026-08-11 | All 18 canonical records independently passed and were controller-accepted; drafted Registry Batch 1 | Complete only the six 38-subsection registries for `C15-CTX-001` through `C15-CTX-006` with exact accepted-state semantics, realistic language, locked Category 1 intent names, focused clarification, authorization/privacy, and no runtime claim while registries 007-018 and Sections 7-8 remain deferred | 0 |
| 2026-08-11 | Remediated Registry Batch 1 metric/basis clarification residual | Ask only the highest-impact accepted metric first, defer any still-unresolved basis to a separate later focused question after target and metric selection, and never infer basis | 0 |
| 2026-08-11 | Registry Batch 1 independently passed and was controller-accepted; drafted Registry Batch 2 | Complete only the six 38-subsection registries for `C15-CTX-007` through `C15-CTX-012` with selected-object provenance/privacy, ticker-safe wording, immutable account scope, response/detail and sort/limit/basis ownership, staged clarification, exact ambiguity atomicity, and no runtime claim while registries 013-018 and Sections 7-8 remain deferred | 0 |
| 2026-08-11 | Registry Batch 2 independently passed and was controller-accepted; drafted final Registry Batch 3 | Complete `C15-CTX-013` through `C15-CTX-018` as the final six 38-subsection Version 0 `Planned` registries with unique accepted-target resolution, explicit owner-validated deltas, correction replacement, atomic/pending state, exact sample/coverage continuation, explanation truth, authorization/privacy, and no runtime claim while Sections 7-8 remain deferred | 0 |
| 2026-08-11 | Registry Batch 3 independently passed and was controller-accepted; drafted Evaluation Batch 1 | Record 18/18 reviewed/PASS registries and add `C15-E1` through `C15-E3` with 66 exact-schema Version 0 `Planned` cases covering accepted intent, metric-set, and temporal state retention, owner-complete contracts, ambiguity atomicity, account isolation, selected context, coverage, privacy, and no invention while evaluation review, the remaining 330 cases, approval, locks, and runtime remain pending | 0 |
| 2026-08-11 | Restored Evaluation Batch 1 source order | Move the complete byte-equivalent `C15-E2` heading and JSON array before `C15-E3`, yielding exact `C15-E1`, `C15-E2`, `C15-E3` order without changing case content, workflow counts, review state, approval, locks, or runtime | 0 |
| 2026-08-11 | Evaluation Batch 1 independently passed and was controller-accepted; drafted Evaluation Batch 2 | Record 66 reviewed/PASS cases for `C15-E1` through `C15-E3` and add `C15-E4` through `C15-E6` with 66 exact-schema Version 0 `Planned` cases preserving complete accepted filter, comparison, and grouping contracts, correction replacement without hidden accumulation, pending-ambiguity atomicity, unique trusted references, account isolation, coverage, privacy, and no invention while Batch 2 review, the remaining 264 cases, approval, locks, and runtime remain pending | 0 |
| 2026-08-11 | Remediated Evaluation Batch 2 gross-expectancy findings | Correct only `C15-E5-19` and `C15-E6-12` to carry the locked expectancy concept and exact gross/before-fee side-specific formula, exclude allocated charges and credits, require compatible recorded currency and nonzero own-side denominators, return zero-denominator unavailability, signed left-minus-right difference plus magnitude, fixed equality, exact counts, and coverage while preserving all other cases, Version 0, review state, approval, locks, and runtime boundaries | 0 |
| 2026-08-11 | Evaluation Batch 2 independently passed and was controller-accepted; drafted Evaluation Batch 3 | Record 132 reviewed/PASS cases for `C15-E1` through `C15-E6` and add `C15-E7` through `C15-E9` with 66 exact-schema Version 0 `Planned` cases preserving trusted typed trade, exact ticker, and Journal-entry selection, same-account ownership/type/current-coverage revalidation, lifecycle and decision coverage, Journal content minimization, focused ambiguity, privacy, and no mutation, cause, advice, or runtime claim while Batch 3 review, the remaining 198 cases, approval, and locks remain pending | 0 |
| 2026-08-11 | Remediated Evaluation Batch 3 temporal-comparison finding | Correct only `C15-E9-12` from `before_versus_after` to the explicit `current_versus_previous` contract with separately Category 13-resolved periods, event basis/timezone/endpoints, compatible metric/basis/fees/currency and side populations, signed current-minus-previous difference, magnitude, equality, no implicit percentage baseline, exact counts/coverage, selected-entry privacy, and no causal claim while preserving Version 0, review state, approval, locks, and runtime boundaries | 0 |
| 2026-08-11 | Evaluation Batch 3 independently passed and was controller-accepted; drafted Evaluation Batch 4 | Record 198 reviewed/PASS cases for `C15-E1` through `C15-E9` and add `C15-E10` through `C15-E12` with 66 exact-schema Version 0 `Planned` cases preserving immutable server-owned single-account scope, normal-selector new-conversation boundaries, Category 18 presentation-only response modes, exact two-track pending-ambiguity outcomes, focused clarification, privacy, and no invention while Batch 4 review, the remaining 132 cases, approval, locks, and runtime remain pending | 0 |
| 2026-08-11 | Evaluation Batch 4 independently passed and was controller-accepted; drafted Evaluation Batch 5 | Record 264 reviewed/PASS cases for `C15-E1` through `C15-E12` and add `C15-E13` through `C15-E15` with 66 exact-schema Version 0 `Planned` cases preserving unique accepted-query targeting, explicit owner-validated filter/time/metric deltas, correction replacement, atomic full-query acceptance, focused pending ambiguity, exact Category 12 filter semantics, Category 13 temporal resolution, locked metric formulas and dependent-field validation, account isolation, privacy, coverage, and no invention while Batch 5 review, the remaining 66 cases, approval, locks, and runtime remain pending | 0 |
| 2026-08-11 | Remediated Evaluation Batch 5 intent, metric-token, and new-query clarification residuals | Correct only `C15-E13-08`, `C15-E13-19`, and `C15-E13-21` to locked `retrieve_records`; correct only `C15-E15-15` to locked `average_hold_duration`; and make `C15-E15-19` a wholly new win-rate query with one focused gross-before-fee versus fee-complete-net classification question, privacy-safe pending state, unchanged accepted state, and later Category 13 time/population/sample/coverage validation while preserving Version 0, review state, approval, locks, and runtime boundaries | 0 |
| 2026-08-11 | Evaluation Batch 5 independently passed; drafted final Evaluation Batch 6 | Record `C15-E1` through `C15-E15` as 330 independently reviewed/PASS Version 0 `Planned` cases and add `C15-E16` through `C15-E18` with 66 exact-schema cases preserving Category 11 grouping ownership, Category 18 presentation-only detail, immutable accepted query/result/snapshot provenance, exact comparison sides and samples, locked-owner adequacy interpretation, atomic correction and ambiguity behavior, privacy, and no cause/advice/runtime invention while final-batch review, approval, and locks remain pending | 0 |
| 2026-08-11 | Remediated Evaluation Batch 6 wholly new-query clarification residuals | Correct `C15-E16-19`, `C15-E17-19`, and `C15-E18-19` to ask one focused metric question first, create only a privacy-safe `clarification_needed` pending marker, leave all prior accepted state unchanged, supply no accepted value or default, and stage each new query's population, time, basis, sample, side, fee, currency, and coverage contracts for later owner validation while preserving Version 0, review state, approval, locks, and runtime boundaries | 0 |
| 2026-08-11 | Evaluation Batch 6 independently passed; Version 0 advanced to Ready for Review | Record all six batches, 18 arrays, and 396 cases independently reviewed/PASS with exact final aggregates, 0 failed/unreviewed/undrafted/pending, and overall evaluation/coverage PASS while preserving unapproved and unlocked canonical names/registries, Planned capability status, Version 0, no master completion claim, and no runtime authorization | 0 |
| 2026-08-11 | Lead controller approved and locked Category 15; promoted records to Version 1 | Approve and lock all 18 exact canonical names and all 18 registries after comprehensive PASS, promote metadata and all 18 canonical record Version fields to 1, and preserve exact names, formulas, 396 evaluation cases, aggregates, Planned capability status, and no-runtime boundary while leaving only master completion synchronization and Category Complete pending | 1 |
| 2026-08-11 | Master completion synchronized; Category 15 marked Complete | Record the master tracker's Complete Version 1 and locked state, close the final two checklist gates, and mark Category 15 Complete while preserving all 18 approved/locked canonical names and registries, formulas, 396 passed evaluations, exact aggregates, Planned capability statuses, and the no-runtime boundary | 1 |
