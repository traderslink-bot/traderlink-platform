# AI Review Insight Ranking Engine Plan

## Status

Design and twelve implementation-readiness QA passes are complete under the
owner's delegated product authority on 2026-08-18. The RSI correctness
prerequisite is implemented with verification pending. Insight-engine
implementation is now underway: the first server-only foundation checkpoint
adds the versioned evidence contracts, exact outcome/rule measurements, typed
rule/evaluator normalization, event-bounded day-rule membership, compatible
outcome comparison, behavior/rate-trend candidate primitives, lane scoring,
overlap/diversity shortlist primitives and an unexecuted deterministic verifier
harness. It is not connected to request issuance or OpenAI yet. The owner does
not need to approve individual formulas or weight calculations, but
the completed engine and its generated reviews remain subject to owner
product-quality review.

This plan continues the
[AI Review Narrative Quality Progress](ai-review-narrative-quality-progress.md)
record. It replaces prompt-only quality correction with a deterministic
evidence, candidate-ranking and provider-selection workflow. Existing issued
reviews remain immutable.

## Decision

TraderLink, not the model, will discover and calculate the candidate findings
for a weekly, two-week or monthly AI Review. The model will receive a short,
ranked and balanced evidence brief plus the underlying permitted context. Its
job is to select a coherent combination of supported findings and authorized
narrative clauses. A deterministic server renderer turns that structured plan
into normal trader-facing language.

The engine will not use one global score to decide the whole review. It will
rank findings inside five separate lanes:

1. **Friction:** the most important behavior or result pattern that worked
   against the trader.
2. **Improvement:** the strongest supported earlier-versus-later change.
3. **Strength:** a repeatable positive behavior or a particularly clear
   execution worth recognizing.
4. **Contrast:** a result/process mismatch such as profitable rule breaks or
   rule-following losses.
5. **Focus follow-through:** later evidence connected to an earlier issued
   review focus.

This separation prevents the largest losing trade from suppressing every
improvement and strength, and prevents a positive month from hiding repeated
process problems.

## Product outcome

A useful review must answer four different questions:

- What happened financially among trades closed during the period, and were
  confirmed positions still open at the boundary?
- What behavior or result improved?
- What specific pattern most held the trader back?
- What happened after an earlier review asked the trader to examine something?

When the evidence exists, the review should identify affected trade counts,
associated P/L, share of losses or profits, weekly change and representative
trades. It should also recognize a strong execution or repeatable strength.
The review is not complete merely because all four visible sections contain
grammatical prose.

The opening has a fixed trader-facing job rather than acting as a loose summary.
Its first sentence reports the period result and activity population. Its second
sentence identifies the strongest supported positive, contrast or result-
composition takeaway that is not already doing the `What held you back` job. A
third sentence is permitted only for a necessary result/process bridge. The
single review-wide coverage boundary remains in `incompleteRecord`, not the
opening. It cannot praise data entry, list the evidence supplied to the model,
preview every later section or turn a profitable
period into proof of strong execution. When there is no eligible positive or
contrast, the opening remains an exact outcome summary instead of filling the
space with generic encouragement.

## Architecture

The engine has seven deterministic stages:

1. Normalize exact account-scoped review facts into prompt-safe day, week,
   trade, rule, analyzer and prior-focus records.
2. Calculate period and week-level denominators once using exact-decimal math.
3. Generate every eligible finding candidate from independent candidate
   families.
4. Score candidates inside their eligible lanes and apply confidence,
   outlier, overlap and coverage adjustments.
5. Build a balanced 15-25 candidate brief, bounded section plans and a small
   globally compatible set of complete review plans.
6. Ask the provider to return the short frozen `providerPackageKey` and select
   one request-local `providerChoiceKey` from that set; the server verifies the
   package key, maps the choice to one exact private `reviewPlanRef`, and the
   provider cannot assemble sections, claims or prose independently.
7. Validate the selected or deterministic-default review plan and persist its
   already-rendered output through the versioned issuance service.

Candidate generation and ranking must remain a pure, deterministic operation.
The same immutable input and engine version must produce the same candidates,
measurements, scores and ordering. With the same renderer/plan versions it must
also produce the same section plans, complete review plans and visible bytes.

## Input authority

### Exact period facts

The current v2 review input remains the factual source for:

- closed-trade P/L;
- factually reconstructable positions still open at the period end, as a count
  and coverage boundary only; no unrealized P/L is invented;
- trading dates and exact review periods;
- named trade and day rule outcomes;
- tags;
- saved daily and trade notes;
- compact Trade Tracker Analyzer event and path evidence;
- coverage limitations;
- prior issued reviews and their next-period focuses.

Two existing Journal authorities must be joined before the engine source is
frozen because the v2 review projection does not currently carry them:

- the trader-declared trade-style plan and revision for each round trip
  (`day_trade`, `swing`, `other` or unavailable/unclassified); and
- exact dated Swing notes and next-session plans linked to the same position.

The v2 projection also reduces rule evidence to title/statement/category plus a
recorded status. The engine source must additionally join the exact rule
lifecycle/effective intervals and, for deterministic preset rules, the existing
trigger/violation evidence events when they are identity-linked to the same rule
version and reviewed target. These facts are necessary to know whether a rule
was actually active and which event—if any—was the violation. They remain
prompt-safe bounded evidence, not a second rule authority.

Trade style is never inferred from duration, timestamps, overnight holding,
Analyzer availability, tracker route or note wording. A missing, unclassified
or `needs_relink` style remains unavailable. Swing-note text follows the same
untrusted-context boundary as daily/trade/rule notes: it can explain an already-
eligible Swing finding or supply an exact safe excerpt, but cannot create a
deterministic category, raise a score or be treated as a completed action.
Only a Swing note whose review date is inside the requested coverage and whose
exact linked round trip is an included closed-trade fact enters the review
source. Notes on still-open positions and outside-period Swing notes remain in
the Journal and do not cross this provider boundary merely because they share a
ticker or position history.

The engine must not import a legacy V3 analytics runtime or a second trade
authority. It may reuse accepted exact-decimal utilities and the current
replacement Journal/Analyzer contracts.

Prior issued-review prose is historical narrative context, not measurement
authority. A monthly request still includes the four actually issued weekly
reviews, but current-month counts, rates, P/L, trends and claims are always
recalculated from the exact current-month source. A stale or inaccurate number
inside earlier review prose cannot become a monthly measurement, candidate or
claim. Historical prose is delimited as untrusted data and can never act as a
provider instruction. Accepted hidden focus metadata remains the authority for
focus follow-through.

Historical prose also cannot decide the review's main conclusions indirectly.
The monthly plan builder freezes a `decisionCriticalSpine` containing the exact
period outcome claim, primary improvement subject/verdict, primary held-back
action target and focus-follow-through target before serializing any weekly
prose. Every complete plan offered to the provider must retain that spine.
Provider alternatives may vary a compatible supporting strength/contrast,
representative example or focus ordering, but not replace a materially ranked
current-month conclusion because an older review emphasized something else.

The current AI Review input has trader-authored daily and trade notes but no
separate structured saved-trade-plan object. The Journal also has Swing notes
and next-session plans, but they are contextual dated text rather than a
structured entry/exit/risk plan. A candidate may discuss alignment with a plan
only when a named rule or the trader's own exact note supplies that plan
evidence. The engine must not turn a tag, trade-style label or generic Analyzer
observation into a claim that a saved plan was followed.

Non-empty trader-authored rule-review notes should be added to the internal
evidence record and shortlisted provider context. They can explain why the
trader marked a rule followed or broken, but they do not change the recorded
status or score by themselves.

Free-text daily, trade and rule notes are never keyword-scored or converted
into deterministic categories by this engine. They accompany already-eligible
findings as untrusted context and may authorize only the exact safe excerpt
boundary defined below. A provider may consider a note while choosing among
complete plans but cannot paraphrase it into the output. A note alone may
support a specific example, but it cannot create a recurring pattern, assign a
motive or increase a candidate's financial/repetition rank. Future structured
plan fields would require a separate accepted contract.

Notes can nevertheless prevent the review from erasing trader-recorded context.
A selected rule/behavior candidate with a non-empty note on an affected
representative observation freezes `contextQualification = present`. Its
section plan uses the objective `marked followed/broken` or `coincided with`
clause and may include one exact safe `you noted` excerpt from that same
observation. The deterministic default prefers the context-qualified clause;
provider alternatives may select another already-qualified representative but
cannot remove the status, reinterpret the note or call the behavior irrational.
If no safe excerpt fits, the review does not claim an exception or explanation.
Unstructured context never changes measurements or score, but a rule break with
context is not rewritten as a motive, discipline failure or automatically bad
decision.

Trader-authored notes, custom rule titles and tags are untrusted evidence data,
not provider instructions. The serializer places them in clearly delimited
fields and tells the provider not to follow commands found inside them. Text
such as `ignore the review instructions` cannot change candidate generation,
lane ranks, allowed selection references or server validation.

### Provider projection privacy allowlist

The provider projection is deliberately smaller than the private calculation
source. `Every permitted exact-month provider field` means every field in the
versioned AI Review provider allowlist, not every row or object held by
TraderLink. The prompt-safe projection may contain the accepted review-period
closed-trade facts, the period-end confirmed-open-position count/coverage state,
dated rule outcomes with bounded prompt-safe preset evidence, prompt-safe trade
style, tags, saved daily/
trade/rule/Swing note and reflection text, deterministic Analyzer aggregates,
bounded representative Analyzer excerpts, coverage state and same-account
issued-review context already authorized by this plan.

Complete eligible one-minute and five-minute Analyzer records remain in the
private immutable calculation source so the engine can detect long-term
patterns. They are not bulk provider context. For each authorized Analyzer
candidate, the provider receives its exact calculated measurements, population,
coverage, week series and representative references. Full excerpt detail is
limited to eight unique trades across the whole package and two per candidate,
selected deterministically by canonical balanced-brief order and then the
section-purpose representative roles below. A mixed/comparison candidate gets
one supporting and one contradicting/remainder excerpt before another candidate
gets a second same-side example. An excerpt contains only the Analyzer
fields needed to support that
candidate's server-owned clauses. Raw candles, unused indicator fields and
unselected trades' one-minute/five-minute observations are excluded. The
provider projection is complete for this narrower schema; that intentional
boundary is not runtime truncation or evidence loss.

A selected preset event projection contains only `trigger` or `violation`, the
prompt-safe affected trade reference, permitted market timestamp, and exact
before/after/threshold values used by an authorized claim. Raw rule/round-trip
IDs, evaluator limitation/internal text and unrelated evidence events remain
local. Status-only rules project no fabricated event object.

It must never contain raw statement/source rows or files, broker-account values,
private Platform/Journal UUIDs, identity fingerprints, email/Discord/payment
identity, Data Decisions records or internal issue text, attachment/screenshot
content or locations, object-storage keys, secrets, credentials, HMAC material,
or facts from another account.

The serializer is recursively allowlist-based: every object uses an exact known
schema, every unknown key fails closed, and no increase in token/context budget
authorizes an additional field. A forbidden-field scan plus exact comparison
against the scoped source's known private identifiers runs on the canonical
provider projection before its package digest is frozen. It does not use a
broad UUID/account-number regex that would reject harmless user-authored text
while pretending to prove privacy. The full package is private review evidence.
Application logs, exception text, support summaries and Admin aggregate views
may retain only bounded failure codes, versions, counts, lengths and digests—
not the package, notes, prior review prose, provider raw errors or rendered
private review text.

The immutable calculation source and provider package remain account-scoped
review history until Platform erasure; later edits do not rewrite them. The
existing AI Review enablement and entitlement gates still apply before this
projection can be created. Before activation, the Help/Privacy language must be
checked against the exact field allowlist and retention behavior; any needed
visible disclosure is a separately owner-reviewed copy change.

### Consistent source snapshot

All facts used by one request must come from one account-scoped, transactionally
consistent SQLite read snapshot. The snapshot builder opens a read transaction,
loads the exact-period Journal facts, rule definitions and outcomes, trade-
style plans/revisions, rule lifecycle and preset trigger/violation evidence,
daily/trade/rule/Swing note revisions, Analyzer evidence, the reconstructable
period-end open-position boundary, coverage state, issued-review metadata and
accepted hidden focus metadata, and
then copies the normalized immutable source before closing the transaction. It
cannot perform a sequence of unrelated live reads that could combine an old
note/style with a new rule result or a revised Analyzer record.

No provider call, network work or candidate ranking runs while the read
transaction is open. If any required scoped row, revision link or identity
manifest cannot be read consistently, request creation fails without saving a
partial request. Candidate calculation runs afterward from only the copied
source. The request and completed insight snapshot are then inserted together
under the atomic persistence boundary below.

### Additional identity needed by the engine

Rule definitions supplied to the engine need prompt-safe structural identity,
not only a title:

- stable prompt-safe rule subject reference;
- rule-version reference;
- source kind (`template` or `custom`);
- template key when one exists;
- review scope;
- custom category;
- whether the rule was saved as a focus;
- effective-from/effective-until timestamps and exact active/paused intervals;
- lifecycle state at the reviewed opportunity and immutable source-snapshot
  timestamp; and
- preset-evidence availability plus identity-linked trigger and violation
  events when the deterministic evaluator supplies them.

These fields let the engine distinguish a preset risk rule from an unrelated
custom review rule and detect a rule definition that changed mid-period.
Private rule IDs and versions never enter the provider package.

The current v2 provider shapes intentionally omit stable trade/rule identities
and reduce saved trade notes to ticker plus text. Before that projection, the
snapshot builder needs an engine-only transient evidence manifest containing
the exact round-trip/version, rule/version, review target, trade-style plan/
revision and daily/trade/rule/Swing note revision links. It converts private
identities to prompt-safe references, attaches each style and note to that exact
reference, and then discards the private IDs from the normalized calculation
source. The engine must never join a style or note to a trade by ticker, date or
array position.

The style projection records its revision, lifecycle state,
`plannedFromEntry`, claimed-effective timestamp and whether its linked round-
trip version is still current. Style-sensitive calculation is unavailable when
that linkage is missing, unclassified or needs relinking. Objective lifecycle
timing is a separate fact: the engine may derive `same_market_date` versus
`multi_market_date` from the accepted timestamps/calendar without calling that
the trader's intent. Version-one Daily Trade Analyzer eligibility requires a
current ready Analyzer linked to the same round-trip version, objective same-
market-date timing and no contradictory declared `swing` or `other` style. An
unknown style does not erase an otherwise eligible historical same-day Analyzer
record, but the renderer calls it an Analyzer-covered same-day trade rather than
claiming the trader intended a Day trade.

If a rule changes materially during a month, trend calculations split at the
version boundary. The engine must not claim improvement across two different
thresholds or statements merely because they share a stable rule identity.

A `rule_review_opportunity` exists only while that exact rule version is
effective and active for the reviewed target. Paused, not-yet-active, expired or
retired intervals are not `not_reviewed` opportunities. A recorded review that
cannot reconcile with lifecycle/version identity makes that rule family
unavailable for the affected target while unrelated findings continue. It never
silently expands the denominator or fails the entire review into a data-quality
response.

Rule normalization freezes one mutually exclusive state before calculating a
rate. An active, applicable opportunity is `reviewed_followed`,
`reviewed_broken`, `explicit_not_reviewed` or `expected_review_missing`.
`explicit_not_reviewed` requires the stored status; absence of a row is
`expected_review_missing` and can never be manufactured into that status.
Inactive/outside-effective targets and targets proven structurally not
applicable are not opportunities. When applicability cannot be determined from
the required facts, the target is `evaluation_unavailable` and cannot enter an
opportunity denominator.

Preset evaluation is an orthogonal evidence axis, not another stored review
status. Each preset target also freezes `evaluated_followed`,
`evaluated_broken`, `not_applicable` or `evaluation_unavailable`. A missing or
explicit-not-reviewed trader disposition can therefore coexist with an exact
evaluator result without being rewritten. Stored review adherence and preset
evaluation rates keep separate populations, measurements, wording and factual-
job keys.

The preset evaluator's legacy `n/a` is not a fifth review outcome. A bounded
local adapter maps a typed evaluator reason to either structurally not
applicable or evaluation unavailable. An unknown/untyped reason takes the
unavailable path. Free-form evaluator limitations never decide the state and
never enter the provider package. The engine therefore cannot convert `n/a`, a
missing result row or an inactive interval into `not_reviewed`.

The version-one typed reason enum is closed:
`no_applicable_target`, `missing_rule_configuration`, `missing_source_fact`,
`ambiguous_execution_sequence`, `insufficient_money_coverage` and
`legacy_untyped`. Only `no_applicable_target` proves structural non-
applicability; every other reason is evaluation-unavailable. Every new evaluator
`n/a` branch must supply a typed reason, and adding a reason requires an engine/
evaluator contract version. Historical untyped evidence maps to
`legacy_untyped` without parsing its limitation string.

These are internal calculation states, not customer copy. When a coverage
boundary must be visible, the renderer says that no rule result was recorded
for an exact count; it never exposes `expected_review_missing`, evaluator codes
or a claim that the trader was obligated to complete a review.

Preset applicability reuses the Journal rule evaluator's exact target/timestamp
logic. Custom-rule applicability reuses the Trade Tracker's historical server-
side projection for that exact target: a day opportunity exists only when the
exact trading-day target exists and the rule version was projected for that
day; a trade opportunity exists only when that exact round trip was projected
under the rule version/scope/entry-time active-interval check. A `both` rule
creates separate day and trade opportunities, never one pooled row. The AI
engine does not invent a day-level shortcut for a trade-timed rule, treat a
missing review row as proof that a target existed or assume that any active
minute makes a whole trading day applicable.

For preset threshold rules, the triggering trade is not automatically the
violation. Only an identity-linked evaluator event with `kind = violation` can
support execution-specific wording. A status-only custom/manual review may say
that the trader recorded the rule as followed or broken, but cannot name the
execution or threshold-crossing moment that caused it. If recorded status and
current reconstructable preset evidence conflict, neither silently overrides
the other; execution-specific rule interpretation is unavailable and the
conflict remains a bounded local limitation.

The trader's recorded followed/broken status remains the rule-rate fact when
its identity and active opportunity reconcile. Preset evidence adds trigger/
violation specificity only; it does not silently recategorize that status. A
status/evaluator conflict lowers structured-source consistency and forces
status-only language.

When no followed/broken trader disposition exists, a complete same-version
preset evaluation may still create an objective preset finding. It says `the
preset rule evaluation found ...`, never `you marked ...`, and it does not raise
review completion. Repeated evaluated-followed evidence may support a narrow
preset-rule strength; it cannot prove that every custom or unevaluated process
rule was followed. The same rule/targets are merged as one evidence cluster so
recorded and evaluated views cannot appear as two independent problems. If an
existing followed/broken disposition conflicts with the evaluator, the earlier
status-only/conflict boundary controls and the objective preset candidate is
suppressed for those targets.

For an applicable opportunity, `reviewed rule rate` uses only followed plus
broken outcomes. `Review completion` is followed plus broken divided by every
expected applicable opportunity. `Recorded disposition coverage` also includes
explicit not-reviewed rows, while missing expected reviews remain a separate
count. Broken prevalence uses every expected applicable opportunity and is
always displayed beside completion coverage. These measures are distinct and
the renderer cannot label one as another.

### Prompt-safe evidence references

Each exact-period trade receives a stable period-scoped prompt-safe reference
derived with the Platform's versioned HMAC boundary from the account scope,
period identity, private round-trip identity and exact reviewed version. It is
stable across input reordering but cannot be reversed or used as a raw private
identifier. The private insight source retains the scoped reference on the
matching evidence record. A
representative trade record may contain:

- reference;
- market date;
- ticker and historical direction;
- opening and closing times already permitted by the input;
- exact P/L;
- trader-declared trade style when available;
- applicable named rule outcomes;
- tags;
- compact analyzer observations;
- the relevant trader-authored note when available.

No private round-trip, execution, account or user identifier or HMAC material
is exposed.

Every other selectable or citable object also receives a deterministic typed
reference. No reference is an array index:

- `noteRef` is a versioned account/period-scoped HMAC reference over the
  private note identity, exact revision and linked evidence target;
- `measurementRef` is a canonical digest of the engine version, `findingRef`,
  metric and unit, observation unit, population/comparison definition, exact
  numerator/denominator member-set digests, exact value, availability, coverage
  and attribution kind;
- `claimRef` is a canonical digest of its finding, ordered measurement
  references, claim kind, subject, attribution, coverage clause and fact-clause
  rendering version;
- `bridgeRef` binds one server-rendered bounded interpretation/transition clause
  to the exact compatible claim-reference set and rendering version;
- `sectionPlanRef` binds one visible section purpose to its ordered finding,
  claim and optional bridge references plus the fully rendered section text;
- `reviewPlanRef` binds the source-snapshot digest, exact request/period
  identity, ordered opening, improvement, friction and follow-through section
  plans, one-to-three focus questions, incomplete-record value, visible output
  contract and renderer version;
- `focusRef` identifies the accepted issued focus and its source review; and
- `focusTargetRef` binds a proposed focus to its source finding, metric,
  direction, baseline, eligibility boundary and target version; each
  `focusQuestionRef` then binds one server-rendered question to that exact
  target and question-rendering version.

Canonical collections are sorted before hashing, so input reordering cannot
change these references. HMAC key rotation may change scoped evidence
references for a newly created request, but it cannot change measurements,
scores, structural tie keys or semantic ordering. Reference derivation versions
are frozen in the insight snapshot.

All references and frozen-package digests use one versioned canonical-byte
format. Schema objects use a declared fixed key order, permitted dynamic maps
are encoded as key-sorted tuples, arrays retain their declared semantic order,
exact decimals remain strings, timestamps use their frozen ISO
form, and the envelope is UTF-8 JSON with no byte-order mark or insignificant
whitespace. Serializer output never depends on property insertion order,
locale or operating-system line endings. User-authored source strings retain
their exact code points in source identity; display-only whitespace/control
normalization happens before a rendered display literal is frozen and never
silently NFC-normalizes or rewrites stored evidence. JSON escaping is
deterministic, including combining and astral characters.

## Normalized evidence matrix

The engine builds the following indexes in one bounded pass:

- trades by market date and calendar-week bucket;
- day records by calendar-week bucket;
- trades by trader-declared style and style-coverage state;
- trades and days by rule subject and rule version;
- reviewed rule opportunities by exact active interval, plus preset trigger and
  violation evidence state;
- trades by exact tag, ticker, session and historical direction;
- trades by fixed Eastern entry-time, holding-duration and weekday buckets;
- trades by Analyzer availability and green-to-red state;
- trades by presence of entry, add, partial-exit and final-exit events;
- issued focuses by source review and source-period end date;
- eligible later evidence dates for each issued focus;
- prior follow-through assessments and evidence boundaries for each issued
  focus;
- exact positive, negative and flat P/L populations;
- exact family-declared opportunity populations as well as affected and full-
  period prevalence populations;
- exact Analyzer-covered populations for every Analyzer-derived rate;
- fixed covered-versus-uncovered balance strata for optional Analyzer and rule-
  review evidence;
- exact dated Swing notes by linked position/trade and note revision; and
- factually confirmed positions open at the period end, without mark-to-market
  or unrealized-P/L values.

All monetary calculations use exact decimal strings. Missing money values are
excluded from monetary denominators but can remain in count-only candidates.
Rates always carry their numerator, denominator and coverage count.

Candidate generation cannot search arbitrary combinations until something
looks important. Ticker, tag, direction, weekday, time and holding-duration
families are evaluated one dimension at a time against fixed product buckets.
Two-dimension intersections are allowed only when a named rule, tracked focus
or existing Analyzer classification defines the intersection before results
are examined. Groups failing the minimum count gate are discarded before full
scoring so high-cardinality tags cannot create an unbounded candidate set.

Entry-time and holding-duration buckets are versioned product definitions, not
windows optimized against the current month's winners and losers. A null
session, holding duration or execution count is unavailable rather than placed
in an inferred bucket.

Version-one fixed Eastern entry-time buckets are: before 09:30, 09:30 to before
10:00, 10:00 to before 11:30, 11:30 to before 14:00, 14:00 to before 15:30,
15:30 to before 16:00 and 16:00 or later. Version-one same-date/declared-Day
holding buckets are: under 1 minute, 1 to under 5, 5 to under 15, 15 to under
30, 30 to under 60, 1 to under 4 hours and 4 hours or more. Declared Day,
objective same-market-date and declared Swing members remain separate
populations. Declared-Swing holding buckets are: under 1 day, 1 to under 3,
3 to under 7, 7 to under 30 and 30 days or more. A stale style link is unknown
rather than silently reclassified.

### Population membership and temporal ownership

Every candidate family freezes one observation unit from a closed enum:
`trade`, `execution_event`, `trading_day`, `rule_review_opportunity`,
`analyzer_covered_trade`, `calendar_week` or `issued_focus`. It also freezes the
sorted unique member-reference set for the eligible population, affected
population, family-declared opportunity population, every comparison side and
every displayed numerator/denominator.
The source validator rejects duplicate members, a numerator outside its
denominator, incompatible units, a trade counted once per event, an event
counted once per trade, or a day P/L member set that does not reconcile to its
exact contributing trades. Counts are derived from the frozen sets rather than
stored as unrelated arithmetic.

An `eligible population` is not automatically the correct denominator for every
behavior. Each rate family must define its opportunity before outcomes are
examined: the members for whom that exact decision or state could be observed.
The engine stores both (a) period prevalence against the full eligible
population and (b) the conditional rate against the opportunity population. It
cannot choose whichever denominator makes a finding look largest. A rate with
no defensible opportunity definition is context-only and receives no repetition
or improvement rank.

The review uses separate, explicit time ownership:

- completed-trade outcome and period P/L belong to the trade's authoritative
  close market date;
- an entry/add/partial/final-exit observation belongs to its exact event market
  date;
- a day-rule outcome belongs to its trading day and a trade-rule outcome to its
  exact reviewed round-trip version;
- daily and eligible Swing notes retain their recorded in-period review date and
  exact linked included target; and
- a prior issued focus belongs to its actual issuance timestamp and eligible-
  later-evidence boundary.

A completed trade may carry lifecycle context from before the period, but an
outside-period execution event cannot be counted as an in-period entry/add/exit
observation or week trend merely because the trade closed inside the period.
Renderer clauses say `trades closed in this period` when result ownership is by
close date and `execution events recorded in this period` when event ownership
is used. Cross-month Swing trades and notes therefore remain truthful without
being silently reassigned to the close week.

The outcome headline includes all eligible closed trades regardless of style.
Style-sensitive process comparisons—entry time, holding duration, session and
any Day-versus-Swing interpretation—must use one known homogeneous style
population. Analyzer/add/exit path candidates instead use the exact objective
same-market-date Analyzer eligibility above and expose declared-style coverage;
they exclude a contradictory declared Swing/other style but may include unknown
historical style without re-labelling intent. A process candidate cannot combine
known Day and known Swing trades unless a later accepted metric explicitly
defines a comparable cross-style population. `Other`, unclassified and
unavailable styles remain in the period result but do not enter declared-style
process ranking. Generic named-rule findings use the rule's exact reviewed
targets rather than inferring style applicability.

### Monthly calculation before canonical provider packaging

The current monthly snapshot removes raw Analyzer detail from dates already
represented by an issued weekly review before serializing the provider package.
That omission must not remove those records from the insight engine's private
calculation source. The new provider-selection package follows the separate
long-term aggregate/representative-excerpt boundary below.

Monthly candidate calculation must run while the local snapshot builder still
has the complete exact-month weekly snapshots and every eligible Analyzer
record. It computes the longer-term Analyzer findings locally, then freezes the
derived candidate brief, measurements, coverage, week series, representative
compact evidence and source digests into the immutable monthly request. The
provider serializer emits one canonical copy of the permitted non-Analyzer
exact-month source plus the calculated Analyzer projection; it does not inherit
the old omission behavior and does not bulk-copy raw Analyzer records.

This preserves every all-month Analyzer fact for calculation without making
hundreds of individual one-minute/five-minute observations compete for the
model's attention. A provider retry uses the frozen brief and canonical factual
projection; it never reopens later Journal state or recalculates against edited
evidence. Weekly inputs remain an immutable audit source, while the locally
calculated monthly projection—not weekly prose—supplies the Analyzer findings.

The monthly provider package contains the four actually issued weekly reviews,
one canonical copy of every permitted non-Analyzer exact-month provider field,
and the exact aggregate/representative Analyzer projection defined above. It
may avoid sending the same exact source record twice merely because that record
also appeared in a weekly input, but it cannot omit, summarize or truncate a
field required by the frozen provider-projection schema or replace it with
weekly prose. Prior weekly prose may help the provider understand what was
previously communicated, but no monthly `claimRef` may cite that prose as its
factual source. Replacing a weekly review's visible text with stale numbers,
generic boilerplate or prompt-like instructions while leaving the exact monthly
calculation source unchanged must not change monthly candidates, measurements,
scores, selection options or server-rendered fact clauses.

### Calendar-week buckets

Monthly week comparisons are recalculated from exact calendar-month facts.
They never reuse a weekly review's P/L or trade totals. A cross-month weekly
review may remain process context, while the monthly week bucket contains only
dates inside the month.

The engine supports four- and five-Friday months, partial first months,
two-week cadence and Monthly-only cadence. Weekly comparisons do not require
weekly reviews to exist; issued weekly reviews add narrative and focus context.

### Cadence-specific improvement baselines

- A first weekly review has no prior-period improvement baseline. It can report
  strengths, friction and within-week differences but cannot call them an
  improvement trend.
- A later weekly review compares compatible current measurements with the
  immediately prior issued weekly/two-week insight snapshot, not with its prose.
- A two-week review may compare its first and second complete cohorts and may
  also use a compatible prior issued snapshot for longer follow-through.
- A monthly review uses exact-month week buckets and the early/later gates in
  this plan. Monthly-only cadence still has week buckets even though it has no
  issued weekly narratives.

Cross-request comparison requires the same metric definition and a compatible
engine measurement version. If calibration changes, the engine either
recomputes both periods from their frozen source measurements under a declared
compatible version or marks the comparison unavailable; it cannot compare two
different score scales as though they were identical.

Comparison populations must also be disjoint. A trade, day aggregate, rule
outcome or Analyzer event cannot appear on both the earlier and later side of
one improvement claim. If nominal request periods overlap, the engine may use
only explicitly constructed earlier-only and later-only remainders that still
pass every evidence and coverage gate; otherwise the comparison is unavailable.
Focus follow-through likewise excludes evidence already used by the source
focus's baseline or source period.

## Candidate record

Every candidate has this conceptual shape:

```text
findingRef
engineVersion
family
polarity
subjectRef
observationUnit
resultOwnership
populationDefinition
populationMemberRefs[]
opportunityDefinition
opportunityMemberRefs[]
affectedMemberRefs[]
tradeStylePopulation
laneEligibility[]
cohortDefinition
comparisonDefinition
measurements[]
weekSeries[]
representativeTradeRefs[]
representativeEvidenceRoles[]
relatedRuleRefs[]
relatedFocusRefs[]
overlapKeys[]
coverage
coverageBalance
latestState
consequenceVerdict
comparisonComparability
contextQualification
futureTrackability
priorAssessmentRef
newLaterEvidenceRefs[]
scores
laneRankStability
adjustments[]
penalties[]
sensitivityResults[]
baselineLineageStatus
rankExplanation[]
```

Each measurement contains its `measurementRef`, stable metric name, exact value,
unit, observation unit, numerator-member references, denominator-member
references, affected count, applicable coverage counts, availability state,
attribution kind and server-generated `displayLiteral`. Numerator membership
must be a duplicate-free subset of denominator membership. A family cannot
silently count trade events in one component and trades or days in another.
Money measurements also contain a money-eligible count. The literal uses
the accepted currency/percentage/count formatter and never guesses a currency
symbol when the period currency is unavailable. When money coverage is partial,
the literal states the covered subset, for example `among the 4 of 6 affected
trades with complete P/L`. The provider cannot silently apply that money result
to all six trades because only the server-owned covered-subset claim is
selectable. Provider output is never used as a measurement.

Rate measurements additionally identify whether their denominator is the full
eligible population (`period_prevalence`) or the family-declared members who
actually reached the observable decision/state (`opportunity_rate`). When both
are useful, both are stored and rendered with different labels. Neither may be
substituted for the other in ranking, trend comparisons or prose.

`engineVersion` freezes candidate families, gates, formulas, weights and tie
breaks, for example `traderlink_ai_review_insights_v1`. `findingRef` is a
deterministic prompt-safe digest of engine version, period, family, subject,
cohort and comparison definition. Input order cannot change it. Existing
requests always use their frozen engine version even after later calibration.

Every directional metric also declares its interpretation explicitly:
`lower_is_better`, `higher_is_better` or `context_only`. The engine never
infers improvement direction from a metric name or provider selection.

## Candidate families

### 1. Period outcome snapshot

Always calculate when the necessary facts exist:

- trade and trading-day counts;
- net P/L;
- win, loss and flat counts;
- win rate;
- total P/L from winning trades and total P/L from losing trades;
- average and median winner and loser;
- largest winner and loser;
- profit factor from those net-trade outcome populations when its denominator
  exists;
- largest-winner and largest-loser contribution;
- result excluding the largest winner or loser;
- factually confirmed position count still open at the period-end boundary;
- count of those still-open lifecycles with accepted in-period position-
  reducing execution events; and
- exact availability of unrealized P/L, which is unavailable in version one and
  is never treated as zero.

This family supplies the opening result but is not by itself evidence of good
or bad process. Its period membership uses authoritative close market dates and
does not imply that every entry, add or exit decision occurred in the period.
The renderer says `closed-trade net P/L` or `across trades closed in this
period`, never that the whole account gained/lost that amount. When at least one
factually confirmed position remained open at period end, `incompleteRecord`
states the count and that unrealized P/L is not included; it does not expose the
positions or guess their value. If one of those lifecycles had an in-period
position reduction, version one also states that exact count and excludes the
still-open lifecycle's partial and eventual result from closed-trade P/L. It
does not extract a supposedly realized amount from an incomplete lifecycle,
because the accepted round-trip result contract becomes authoritative only at
closure. This prevents a reduction from being counted now and the complete
trade result from being counted again after closure.

Period-end open state is reconstructed from the current canonical accepted
execution ledger truncated at the exact period boundary. It is not read from a
round trip's present-day open/closed flag, because a position open on month-end
may close before the review is generated or retried. Corrections available when
the immutable source is frozen follow the normal canonical-lineage rules; later
edits never rewrite an issued count.

The open-position count is a coverage boundary, not an exposure measurement.
It does not describe quantity, capital at risk, unrealized gain/loss or the
materiality of those positions and contributes no ranking points.

This engine does not broaden the existing cadence/request eligibility rules.
If an upstream-eligible period has no trades closed, the opening states exactly
that and leaves net P/L, win rate and winner/loser metrics unavailable rather
than zero. Structured in-period rule or execution evidence may still support a
narrow section if it passes its own gate; reflections or the existence of
Tracker records cannot. A one- or two-trade period may supply an outcome or
labelled example/outlier, never a recurring pattern without the applicable
independent-spread gate. When neither a visible finding nor a measurable focus
exists, the review uses the exact no-supported-pattern boundary instead of
inventing a lesson from sparse activity.

### 2. Named rule association

For every unchanged named rule and valid scope:

- exact active-opportunity count after effective/paused/retired intervals;
- followed, broken, explicit not-reviewed and expected-missing counts;
- followed and broken rates among reviewed outcomes;
- review-completion and recorded-disposition coverage;
- broken prevalence among every expected applicable opportunity, kept distinct
  from the reviewed-only broken rate and exact completion coverage;
- for presets, evaluated-followed, evaluated-broken, not-applicable and
  evaluation-unavailable counts plus the violation rate among evaluation-
  eligible targets, kept distinct from every stored-review measure;
- affected trade or day count;
- P/L for trades or days where the rule was followed;
- P/L for trades or days where the rule was broken;
- adverse or beneficial net contribution of each cohort after its winning and
  losing members are combined;
- total losing-trade P/L inside the broken cohort;
- broken-cohort share of the period's total losing-trade P/L;
- total winning-trade P/L inside the broken cohort;
- week-by-week counts, rates and associated P/L;
- up to three representative affected trades or days; and
- for preset rules only, exact trigger/violation event counts and references
  when the same-version evaluator evidence is available.

Full-day rule P/L is only `day_outcome_context`: the exact included closed-trade
P/L for that trading day. It can show what happened on days marked followed or
broken, but it supplies no financial-consequence rank and cannot be described
as the amount after or caused by a break. Trades completed before a late-day
violation do not become financially affected by it.

A preset day rule may receive event-bounded financial association only when its
same-version evaluator contract returns an exact typed affected-execution set
for that preset's semantics. The engine validates that every member occurs at
the authorized violation boundary or later as the preset defines; it never
constructs the set from a timestamp or title alone. The trigger remains outside
the violation set unless the typed preset contract explicitly says otherwise.
Without that set, financial consequence is unavailable even when full-day P/L
is known. Trade-rule P/L uses only the exact affected completed trade. Day and
trade findings remain separate and are never added together.

A trade can appear in several rule cohorts. Overlapping loss shares are never
summed as if they were independent damage.

Rule-level prose reflects the evidence tier. `status_only` supports `you marked
this rule broken on 4 reviewed opportunities`. `preset_violation_event` may also
name the exact violating trade/time and distinguish it from the trigger.
Missing evaluator events, a custom rule, or a lifecycle/status conflict can
never fall through to an invented execution-level explanation.

An evaluator-only tier instead supports `the preset rule evaluation found 4
violations among 12 evaluation-eligible opportunities`. It cannot use the
trader-attributed status wording, count those 12 as completed reviews or run in
parallel as a duplicate finding for the same rule/target members.

### 3. Rule adherence improvement or deterioration

For a rule with sufficient early and later observations:

- first-half and second-half broken rates;
- complete weekly rate series;
- change in broken count and rate;
- change in associated losing-trade P/L and net P/L;
- number of weeks supporting or contradicting the direction;
- whether an earlier focus referenced the same rule subject.

The default monthly comparison is activity-weighted Weeks 1-2 versus Weeks
3-4 for a four-week context. Five-week months use the first two versus final
two weeks and preserve the middle week as a consistency check. Partial months
use the earliest and latest two eligible buckets only when both sides meet the
minimum evidence gate.

### 4. Favorable-move and green-to-red outcomes

From Analyzer-covered trades:

- never-green, green-no-red, ended-red, recovered and ended-flat counts;
- period-prevalence rates using every Analyzer-covered eligible trade as the
  denominator;
- ended-red rate among trades that first moved green, and recovery rate among
  trades that actually crossed from green to red;
- combined final P/L by state;
- combined measured peak P/L;
- combined peak-to-final reversal;
- combined peak-to-red reversal;
- trades and counts involving adds after the peak;
- trades and counts involving a partial exit before turning red;
- best-profit-opportunity counts and measured windows;
- weekly count, rate, P/L and reversal series;
- representative high-impact and representative typical trades.

The conditional denominators are fixed by the state machine rather than chosen
from the more dramatic percentage. `Moved green and ended red` may therefore be
reported as both `5 of 100 covered trades` and `5 of 6 covered trades that moved
green`; only the latter is the management-opportunity rate. Recovery is divided
by trades that crossed green-to-red, not by every covered trade. An add-after-
peak decision is divided by trades with an eligible observed add/path
opportunity, while its prevalence remains against all covered trades. A partial-
before-red measurement is divided by the exact observed green-to-red transition
opportunities. These populations are frozen before financial outcomes are
ranked.

Version one admits only objective same-market-date members with a ready Daily
Trade Analyzer record linked to the same current round-trip version and no
contradictory declared `swing` or `other` style. A declared `day_trade` and an
unknown historical style can both qualify; the latter remains visibly unknown
rather than being reclassified. Multi-market-date, style-`needs_relink`, Swing
and `other` members are Analyzer-unavailable even if a stale or accidentally
reachable Daily Trade Analyzer row exists.

The engine separately identifies:

- profitable trades with large measured giveback;
- trades that moved green and ended red;
- trades that recovered after turning red;
- trades that protected most of their measured favorable result;
- improving or worsening giveback rates across weeks.

The version-one non-optimized path thresholds are fixed before results are
seen: a profitable large-giveback member has a fee-complete positive peak and
gives back at least 50% of it by the final result; a high-retention member keeps
at least 70% of the measured peak. These thresholds classify the Analyzer path
only. Journal net P/L remains the financial ranking fact.

Rates are suppressed when Analyzer coverage is too low. Count and money totals
remain available with an explicit covered-population denominator.

### 5. Entry evidence

Entry candidates combine only evidence available at or after the completed
historical trade:

- entry event presence and Analyzer readiness;
- favorable and adverse movement after entry;
- available one-minute and completed five-minute context;
- entry/setup rule results;
- saved setup tags and trade notes;
- final result and later management evidence.

A repeatable positive entry candidate requires more than a winning outcome.
The default high-confidence form requires an entry/setup rule followed, no
conflicting broken entry/risk rule, ready Analyzer evidence and at least two
comparable examples. A trader-authored note can add context to a specific
example but cannot replace the structured rule gate for a recurring plan-
alignment claim. A single especially clear trade may be offered as an example
candidate but not as a recurring pattern.

The version-one specific strong-entry example requires current-linked Analyzer
evidence, both initial-entry favorable and adverse movement, favorable movement
at least twice the absolute adverse movement and a positive completed Journal
net result. At most five such examples enter private ranking, ordered by exact
net result and the prompt-safe trade reference. Without the structured entry/
setup rule gate above, this path is forced to `specific_example` and cannot be
promoted to a recurring strength.

The engine must not combine one-minute and five-minute observations into an
invented signal or infer a strategy edge from a small sample.

Analyzer favorable/adverse movement and post-exit path decimals are price
movement, not trade P/L. They can support a representative trade but cannot be
summed across tickers or ranked as financial impact. Cross-trade percentage
claims require an accepted percentage field with an explicit denominator; the
engine will not manufacture a percentage from fields that lack one.

One-minute RSI 14 is the version-one long-term technical-context family, not a
standalone review finding. Its exact bands are `[0,30)`, `[30,40)`, `[40,50)`,
`[50,60)`, `[60,70)` and `[70,100]`; thresholds are never optimized after
seeing results, and an out-of-range value is unavailable as RSI evidence.
Version one uses only the initial-entry and final-exit event, giving each trade
at most one
`analyzer_covered_trade` observation in either role. Add and partial-exit RSI
may support a selected example but cannot create an RSI cohort or repeat the
trade's result.

Long and short trades and entry/final-exit roles stay separate. An affected
band is compared only with the other corrected-version RSI-eligible trades of
the same direction and event role in the period. All non-empty direction x role
x band groups count as siblings under the Segment gate before outcomes are
inspected. Indicator-by-tag/setup intersections are excluded in version one.
Five-minute RSI is unavailable in the current Analyzer contract and cannot be
invented from the one-minute value.

One-minute EMA distance, VWAP distance and relative volume, plus completed
five-minute EMA distance and relative volume, remain available to the local
engine and may supply bounded context for a selected representative trade. They
do not generate recurring technical-context candidates until a later accepted
engine version defines their fixed cohort boundaries, comparison population and
multiplicity tests. The provider cannot turn those fields into a new finding.

The source audit found that the prior unversioned RSI implementation is not
eligible for AI ranking: it returns unavailable when average loss is zero and
has no accepted reference-vector proof for its Wilder seed/smoothing. Therefore
RSI stored
without the exact accepted `wilder_rsi_14_v1` calculation version contributes no
candidate, score, claim or provider excerpt. The immutable corrected version
uses an exact 14-change initial average followed by Wilder smoothing and defines
the zero cases exactly:
gain above zero/loss zero = 100, gain zero/loss above zero = 0, and both zero =
50. Golden reference vectors, strictly rising/falling/flat sequences, minimum-
history, missing-candle and ordering cases must pass the focused verifier.

Existing Analyzer snapshots remain immutable. Corrected RSI is stored only in a
new current analysis revision with the calculation-version field, produced from
available accepted candle evidence. The implementation does not rewrite old
snapshots, fabricate corrected history or make an external market-data call
merely to fill AI Review coverage. Mixed old/new months expose exact RSI-
eligible coverage, and only the corrected-version population can enter an RSI
comparison.

A single event's RSI or other indicator may appear only as supporting context
for a selected representative trade. It cannot become a weekly/monthly headline
or advice by itself. A recurring RSI-context candidate must show the exact
covered count and denominator, comparable remainder, independent time
spread and result/path difference. Its language remains associative—for
example, `8 of 11 comparable long entries with RSI 14 from 60 to 70 were
profitable`—rather than claiming that RSI caused the outcome or directing a
future trade.

### 6. Adds and add sequence

Calculate:

- trades with at least one add;
- add count distribution;
- trades with an add after the measured P/L peak;
- add-related named rule outcomes;
- P/L and giveback for trades with and without adds;
- week-by-week add frequency and results;
- clean positive examples where the available add, rule, risk and later path
  evidence agree;
- harmful examples where adds coincide with measured deterioration or a
  broken add/risk rule.

Add prevalence uses every eligible trade, while add quality/sequence rates use
only trades with at least one observed add and the exact path evidence required
for that question. A no-add trade cannot dilute an add-after-peak rate merely
because it was in the period.

An add cohort is not automatically a problem. Positive, negative and mixed
add candidates are generated separately.

The current AI Review facts expose add events but not share quantity, position
notional, planned risk or size added at each event. The engine can review add
frequency, sequence, path and named sizing-rule outcomes; it cannot calculate
oversizing or size escalation from unavailable quantities. A sizing finding
therefore requires a recorded named sizing/risk rule until an accepted
quantity/risk contract is added.

### 7. Partial and final exits

Calculate:

- trades with and without partial exits;
- partial-exit-before-red counts;
- applicable partial/final-exit rule outcomes;
- measured giveback at partial and final exits when available;
- post-final-exit favorable paths at 5, 15, 30 and 60 minutes;
- P/L and peak-to-final reversal for comparable exit cohorts;
- weekly change in exit-related rule adherence and giveback.

Partial-plan adherence uses the rule's applicable reviewed opportunities.
Observed post-final-exit path rates use eligible final-exit events. A trade with
no applicable partial plan is not silently placed in the failed-partial
denominator, and a missing post-exit window is coverage loss rather than a zero.

Post-exit movement is an observation, not automatic proof that an exit was
wrong. A negative exit candidate needs supporting saved-plan, rule or repeated
capture evidence. A positive exit candidate needs evidence that the exit
limited giveback or avoided later deterioration.

Post-exit price movements from different tickers are not added together. Only
the Analyzer's compatible P/L-path fields can support aggregated money impact.

### 8. Risk, stop, sizing and daily-boundary rules

Preset template identity allows higher-confidence process families for:

- cooldown after a loss;
- same-ticker re-entry cooldown;
- maximum ticker attempts;
- maximum trades per day;
- no new trades after a selected time;
- stop after consecutive or total daily losses;
- stop after a realized daily loss;
- stop a ticker after losing attempts;
- stop after realized profit giveback;
- stop after a realized daily gain limit;
- excluded entry-price ranges.

Custom rules remain eligible through the generic named-rule families. Their
title alone does not receive an invented risk classification.

### 9. Re-entry, repeated attempts and day sequence

When exact trade order exists, calculate:

- trades following a completed loss;
- same-ticker attempts and re-entries;
- trades after daily or ticker loss thresholds;
- trades after realized peak-profit giveback;
- later-session trades after a day was already net positive or negative, with
  exact cumulative realized P/L at the later entry;
- P/L and rule outcomes for each sequence cohort;
- whether the pattern repeated on separate days or weeks.

This family uses exact chronology and existing evaluated rules. It does not
infer revenge, frustration or motive from trade order alone. A trader-authored
note or named rule may support the trader's own behavioral label. Trading again
after a day turns green or red is not itself called a violation; a negative
process conclusion requires a named boundary rule or a repeated materially
harmful result under the normal evidence gates.

### 10. Concentration and outliers

Calculate:

- percentage of total losing-trade P/L represented by the largest one, three and five
  losing trades;
- percentage of total winning-trade P/L represented by the largest one, three and five
  winners;
- worst and best day contributions;
- P/L excluding the largest winner and largest loser;
- ticker, tag and session concentration;
- whether an apparent pattern disappears when one outlier is removed.

One-off material outliers remain eligible as explicit outlier findings but
receive no recurrence credit and cannot be described as repeated behavior.

### 11. Ticker, tag, session, direction, time and duration cohorts

Generate a cohort only when the compared population is large enough:

- trade count, P/L, win rate and loss share;
- comparison with the remaining eligible trades;
- weekly spread;
- applicable rule and Analyzer coverage;
- representative trades;
- sensitivity after removing the cohort's largest winner and loser.

Session candidates remain unavailable while `tradingSession` is null. Entry
time may still use the exact timestamp and accepted Eastern timezone. Holding
duration uses the supplied duration and fixed buckets; it is not reconstructed
from prose. Weekday is derived from the authoritative market date.

Exact tags are observations, not proof that a setup caused the result.
Historical long/short direction can be reviewed, but the output cannot become
a recommendation to favor or avoid a direction.

Entry-time, session and holding-duration comparisons are built separately for
known Day and known Swing populations. Version one has no Swing Analyzer family
and cannot use day-trade candle/path thresholds to assess a Swing. A tag/ticker
outcome may span styles only as a plainly labelled all-closed-trades result; it
cannot carry an execution-process interpretation unless the style population is
homogeneous.

### 12. Positive process and repeatable strengths

Search deliberately for:

- profitable trades that followed one exact repeated named process rule;
- losses where every rule required for the claimed process set was reviewed and
  followed;
- trades that followed entry, risk and exit rules together;
- controlled favorable-move giveback;
- effective stop response;
- clean, supported adds;
- strong entry examples;
- improved behavior sustained across later weeks;
- profitable cohorts whose result is not dependent on one outlier.

The engine distinguishes a repeatable strength from a single example. A losing
trade may support positive process when its rules and execution evidence do.

Absence of a recorded break is not positive process evidence. A `clean
execution` or `all relevant rules followed` claim freezes the exact applicable
entry/risk/exit rule set and requires every member to have a followed result for
every required rule; explicit not-reviewed, inactive, unavailable and missing
outcomes do not count as followed. A narrower strength may truthfully say one
named rule was followed repeatedly without claiming the rest of the process was
clean.
Profitable outcome plus sparse rule review remains an outcome/example, not a
process strength.

For a preset rule, repeated same-version `evaluated_followed` targets may supply
that narrow one-rule strength even when the trader did not save dispositions,
provided evaluator coverage and the normal strength gates pass. The renderer
attributes it to preset evaluation and does not call it completed review or a
clean multi-rule process.

The required rule set comes only from preset template keys/scopes or a future
accepted structured process-set mapping. The engine cannot decide that a custom
title belongs to entry, risk or exit by reading its words. Without a complete
structured set, only the one-rule strength form is eligible.

### 13. Result/process contrasts

Create explicit candidates for:

- profitable trades with broken rules;
- losing trades with followed rules;
- positive month with material process friction;
- negative month with measurable process improvement;
- high win rate with losses concentrated in a few trades;
- low win rate with favorable winner/loser economics;
- good entries followed by weak management;
- weak entries followed by favorable outcomes;
- improved behavior without improved P/L, and the reverse.

These candidates are often the best opening takeaway because they prevent the
review from equating results with process.

### 14. Focus follow-through

Every newly generated weekly focus must carry hidden tracking metadata:

- source review reference, period end and actual issued-at timestamp;
- originating finding family and subject reference;
- later metrics capable of evaluating it;
- baseline values and exact eligible-later-evidence timestamp;
- most recent review that already assessed this focus, its evidence boundary and
  exact later members used; and
- whether the focus concerns reduction, consistency, examination or strength
  repetition.

The visible focus remains ordinary prose. The tracking metadata is stored with
the immutable issued review and is not shown as system language.

For existing reviews without tracking metadata, the engine may build a lower-
confidence candidate by matching the focus against exact named rules, tags and
candidate families. It cannot manufacture a match from general word overlap.

Every tracked baseline also freezes the contributing source-version manifest.
Before later comparison, the engine checks those round-trip, rule, Analyzer and
style versions against the current canonical lineage. A corrected, excluded,
relinked or otherwise superseded baseline is not compared as though it were
still current. The engine may recompute the old side from currently canonical
facts only when the complete original period can be reconstructed under the
same metric/version and the review labels it a revised baseline; otherwise the
verdict is `not measurable from later evidence` with
`baseline_source_superseded`. The issued review remains immutable either way.

A follow-through verdict is one of:

- improved;
- improved but still inconsistent;
- sustained strength;
- unchanged;
- worsened;
- mixed;
- measured without a directional target;
- not measurable from later evidence.

Later evidence begins after both the source period's final market seal and the
actual review issuance timestamp. Exact trade/event evidence must occur after
that boundary. Day-level evidence begins on the next market date when the
issuance-day aggregate would mix pre- and post-focus activity. A delayed review
therefore cannot claim follow-through from trades that occurred before the
trader received its focus. The candidate records the exact later weeks,
denominators, measurements and contradictory evidence behind the verdict.

A focus already assessed in an issued review is not measurable again from the
same later members. It becomes eligible only after at least one new independent
later bucket/market date enters its declared metric and the incremental members
pass that family's normal minimum, or a new material outlier changes the
verdict. The candidate stores cumulative-since-focus and incremental-since-last-
assessment populations separately; visible wording identifies which comparison
it uses. An unassessed measurable focus is preferred over an already-assessed
focus within 10 lane points. The same focus may repeat in consecutive reviews
only when new evidence causes a material verdict change/worsening or no
unassessed measurable focus exists within that range. This prevents the oldest
focus from winning every monthly review merely because it has the longest
evidence span.

## Evidence gates

### General pattern gate

A recurring pattern uses the cadence's independent spread axis:

- a weekly review uses separate market dates;
- a two-week or monthly review uses separate calendar-week buckets.

Each family also declares the observation unit that must satisfy this gate.
Three add events on one trade are not three recurring trades; three rule
reviews on one day are not three independent days. A family that displays both
event and trade counts names one as its primary repetition unit and keeps the
other supporting-only.

It normally requires either at least three affected observations across two
independent spread buckets, or at least two affected observations across
separate buckets plus a material financial contribution. This allows a weekly
review to identify repetition across trading days without pretending that
multiple trades on one day establish a period-wide habit.

A single observation can qualify only as an explicit material outlier or a
specific execution example.

### Rule gate

- At least three reviewed outcomes are required for a rule rate.
- `explicit_not_reviewed` and `expected_review_missing` are excluded from
  followed/broken rate denominators and remain separately visible; evaluator
  `n/a`, inactive and structurally not-applicable targets never enter that
  opportunity population.
- Reviewed-rule claims require their exact reviewed count plus expected-
  applicable count. A low-completion cohort cannot use the reviewed-only rate
  as a period-wide adherence claim or clean-process strength.
- A preset evaluator rate independently requires at least three evaluation-
  eligible targets, exact followed/broken counts and its unavailable/not-
  applicable coverage. It never substitutes for review completion.
- A recurring broken-rule finding normally requires at least two breaks.
- One break may qualify as a material outlier when its loss represents at least
  10% of the period's total losing-trade P/L.
- A day-rule financial finding requires a typed event-bounded affected-
  execution set. Full-day P/L is context-only and cannot satisfy the material-
  outlier or financial-consequence gate.
- Rule improvement follows the cadence-specific improvement gate below rather
  than requiring three current-period week buckets for every cadence.

### Segment gate

The multiplicity count is the number of non-empty sibling groups with the
family's required raw fields before result, money or outlier gates are examined.
This prevents the result itself from deciding how many hypotheses the engine
claims it tested. Version one uses this exact schedule for ticker, tag, session,
direction, entry-time, duration and RSI-context families:

| Non-empty sibling groups | Affected cohort | Comparison cohort | Independent spread | Largest absolute P/L contributor |
| --- | ---: | ---: | ---: | ---: |
| 1-5 | at least 5, or 3 | at least 5 | 2 buckets when using the 3-trade path | at most 70% |
| 6-10 | at least 6 | at least 6 | at least 2 buckets | at most 65% |
| 11-25 | at least 8 | at least 8 | at least 3 buckets | at most 60% |
| 26 or more | at least 10 | at least 10 | at least 3 buckets | at most 50% |

A cohort failing only the contributor limit may remain as an explicitly
outlier-dependent example, never a stable segment pattern. The table replaces
the earlier undefined instruction to merely make gates stricter as sibling
count rises.

### Analyzer gate

- Analyzer-derived rates use ready Analyzer trades only.
- Version-one Daily Trade Analyzer candidates require current ready evidence,
  objective same-market-date timing and no contradictory declared Swing/other
  style. Unknown historical style remains eligible but cannot be described as
  trader-declared Day intent.
- At least three covered trades are required for a rate.
- Period-wide Analyzer language requires at least 60% trade coverage.
- Below 60%, the finding must state the exact covered population and cannot be
  described as representative of all trades.
- Monetary peak/giveback aggregation requires `feesComplete = true` for every
  included Analyzer path. A path with incomplete fees remains eligible for
  count/status observations but not pooled peak, reversal or final-P/L money.
- Price-move decimals from entry and post-exit paths remain per-trade evidence
  and never enter pooled money or percentage calculations.

### Optional-evidence balance gate

Overall coverage percentage does not prove representative coverage. Analyzer
readiness can be concentrated in winners or one week, and rule reviews can be
completed mainly after losing trades. Version one therefore checks coverage
before outcomes are used for a period-level conclusion:

- Analyzer ready versus unavailable is compared across fixed calendar-week,
  final-result-polarity (positive, negative, flat or money-unavailable) and
  known-style/unknown-style strata inside the exact
  objective Analyzer-eligible population;
- rule review completion (followed/broken) versus explicit not-reviewed plus
  expected-missing is compared across fixed calendar-week and the same four
  final-result-polarity strata inside the rule's expected applicable
  population; recorded-disposition coverage is audited separately so missing
  rows cannot look like deliberate non-review;
- preset evaluated-followed/broken versus evaluation-unavailable is compared
  across the same fixed strata inside the preset-evaluable target population;
  structurally not-applicable targets remain outside it;
- a stratum is material only when it has at least five members and represents at
  least 10% of the expected population; and
- coverage is `materially_skewed` when a material stratum's observed rate differs
  from the rest by at least 20 percentage points or its share of observed
  evidence differs from its share of expected evidence by at least 15 points.

When coverage is materially skewed, the finding may still describe the exact
covered/reviewed subset, but it cannot generalize to the whole period. The
required-field confidence component uses the lowest material-stratum coverage,
not the favorable overall average. A result-polarity-skewed optional source
cannot supply a main financial-drag or outcome-support headline; its exact money
remains covered-subset context. Improvement requires a fixed common stratum
comparison under the existing composition check. Too little evidence to test
balance is `balance_unavailable`, never assumed balanced.

Coverage skew is a limitation on the finding, not a new trader-performance
candidate. The review may state the bounded limitation in `incompleteRecord`,
but it cannot turn `review more trades` or Analyzer availability into `What
improved`, `What held you back` or a next-period trading focus.

Result polarity follows the candidate's observation unit: exact trade net P/L
for trade/Analyzer evidence and the reconciled included day P/L for day-rule
opportunities. The gate never duplicates a day once per contributing trade.

### Improvement gate

Improvement or deterioration requires one valid comparison shape:

- a monthly within-period comparison has at least three observed week buckets
  and at least five eligible observations in each early/later population;
- a two-week within-period comparison has two complete eligible cohorts and at
  least five observations in each;
- a later weekly or two-week cross-request comparison has at least five
  eligible observations in both the compatible frozen prior measurement and
  current measurement. Two points support `improved since the prior review`,
  while a sustained-trend claim requires at least three compatible periods;

Every shape also requires:

- a family-declared primary metric and improvement direction;
- the same metric, unit, eligibility definition and rule/Analyzer version on
  both sides;
- a meaningful count, rate, money or path change under the default thresholds
  below;
- later evidence after the comparison baseline;
- no material rule-definition change across the compared observations.

A flat or contradictory series produces an unchanged or mixed candidate, not
an improvement candidate.

An early-versus-later average also cannot hide the trader's current state. The
candidate freezes the last sufficiently populated bucket and the immediately
preceding comparable bucket. A rate improvement becomes
`improved_then_recently_regressed` rather than clean improvement when the latest
bucket has at least five eligible observations across at least two independent
market dates, moves adversely by at least 10 percentage points and erases at
least half of the earlier-to-later gain. Day-unit metrics require at least two
eligible days. A
money/path improvement uses the same verdict when the latest median moves
adversely by at least 20% and erases at least half of the gain. The section
states both the earlier improvement and the latest reversal. A sparse partial
bucket that fails either population or independent-date minimum is shown as
preliminary evidence and
cannot by itself reverse or confirm the monthly verdict.

One high-volume market date therefore cannot reverse a monthly trend verdict
merely by containing many trades or events. It may appear as a material recent
outlier with its exact date and impact, but recurrence and latest-state language
remain separate.

The relative money/path branch is unavailable when its comparison median is
zero; it cannot manufacture an infinite reversal. A valid fixed absolute path
threshold may qualify only when that family already declares one in the engine
version.

Activity weighting does not by itself make changing denominators comparable.
For rule rates, each side records reviewed, explicit-not-reviewed, expected-
missing and expected-applicable counts.
For Analyzer rates, each side records ready and total eligible trades. A
version-one shift of more than 15 percentage points in review/Analyzer coverage
forces a mixed or unavailable comparison unless a fixed common eligible cohort
can be calculated. If the affected rate improves while the affected count or
financial/path effect materially worsens, the candidate is mixed rather than
an unqualified improvement.

Changing opportunity mix also receives an explicit sensitivity check. Each
family declares only its pre-result structural strata—such as exact trade style,
rule version/scope or Analyzer contract/state—and cannot search tags or cohorts
after seeing outcomes. For a rate comparison, a stratum representing at least
20% of the pooled eligible population is material when its early-versus-later
population share moves by at least 15 percentage points. The engine then
recomputes a pooled-weight standardized rate change from the same within-
stratum rates. If the standardized direction reverses the raw direction, the
candidate is mixed; if direction agrees but magnitude differs by more than 50%,
confidence is reduced and both values remain auditable. If required strata are
missing or no common opportunity population exists, the comparison is
unavailable rather than called improvement. This is the version-one defense
against a Simpson's-paradox result caused by trading a different mix later.

The default meaningful-rate threshold requires at least two fewer/more
affected observations and either:

- at least a 10-percentage-point activity-weighted rate change; or
- at least a 5-percentage-point change, at least five affected-observation
  difference and support from three compatible comparison buckets or periods.

A money/path-only trend requires a comparable opportunity population, at
least three observations on each side, a 20% change in the median per-
observation value and an absolute contribution of at least 5% of the period's
total winning- or losing-trade P/L. These are initial versioned calibration
thresholds, not universal statistical truths.

When the earlier median is zero, relative percentage change is unavailable.
The candidate can qualify only through an explicit non-relative count/rate
threshold or the defined period-relative contribution threshold; the engine
never reports an infinite, universal-dollar or manufactured percentage
improvement.

Each family declares one primary trend metric. Supporting P/L, count and path
measurements cannot be averaged together to hide disagreement. When a
material supporting metric moves in the opposite direction, the engine emits
a mixed candidate or lowers confidence instead of calling the behavior simply
improved.

### Strength gate

A recurring strength requires at least three examples across two cadence-
appropriate independent spread buckets: market dates for a weekly review and
calendar-week buckets for a two-week or monthly review. One trade can be a
strength example when its process evidence is unusually clear, but the review
must not generalize it to the period.

Rule-based strength additionally requires either one exact named followed rule
as its bounded subject or complete review coverage for the family-declared
multi-rule process set. `No broken rules found` is not an eligible strength
template. Analyzer-only strength still requires its own ready-evidence and
coverage gates rather than borrowing missing rule coverage.

## Exact measurements

All divisions expose the exact numerator and denominator and use the accepted
exact-decimal math utilities. Display rounding never changes ranking inputs.

Key definitions:

- **Total losing-trade P/L:** absolute sum of all negative included net trade
  P/L. This is a performance population, not the trade's unavailable broker
  gross-P/L field.
- **Total winning-trade P/L:** sum of all positive included net trade P/L.
- **Period absolute P/L magnitude:** total winning-trade P/L plus the absolute
  total losing-trade P/L. It is a scale denominator, not the period's net P/L or
  a statement of turnover.
- **Win rate:** positive-P/L trades divided by every included trade with a
  non-null P/L, including flat trades in the denominator, matching the current
  v2 input calculation.
- **Loss rate:** negative-P/L trades divided by every included trade with a
  non-null P/L, also including flat trades in the denominator.
- **Loss share:** absolute negative P/L inside a cohort divided by the period's
  total losing-trade P/L.
- **Profit share:** positive P/L inside a cohort divided by the period's total
  winning-trade P/L.
- **Cohort net P/L:** exact sum of every money-eligible positive, negative and
  flat member in the cohort; winners cannot be dropped from a negative finding
  and losers cannot be dropped from a positive one.
- **Adverse net contribution:** absolute value of the negative part of cohort
  net P/L divided by the period's total losing-trade P/L. It is zero when the
  cohort is flat or net profitable.
- **Beneficial net contribution:** positive part of cohort net P/L divided by
  the period's total winning-trade P/L. It is zero when the cohort is flat or
  net losing.
- **Broken rate:** broken divided by followed plus broken.
- **Review completion:** followed plus broken divided by every expected active,
  applicable rule-review opportunity.
- **Recorded disposition coverage:** followed plus broken plus explicit not-
  reviewed divided by every expected active, applicable opportunity. It never
  treats a missing row as an explicit disposition.
- **Broken prevalence:** broken divided by every expected active, applicable
  opportunity, including explicit not-reviewed and missing expected rows in the
  denominator.
- **Preset evaluated violation rate:** evaluated-broken divided by evaluated-
  followed plus evaluated-broken. It never borrows the stored review denominator
  or relabels evaluation-unavailable as followed.
- **Affected rate:** affected eligible observations divided by the candidate's
  exact eligible population.
- **Opportunity rate:** affected observations divided by the predeclared members
  for whom the exact decision/state was observable; it is never interchangeable
  with period prevalence.
- **Independent spread:** affected market dates divided by eligible observed
  market dates for a weekly review; affected week buckets divided by eligible
  observed week buckets for a two-week or monthly review.
- **Peak-to-final giveback:** Analyzer-supplied peak-to-final reversal only; it
  is not recreated from unrelated price fields.
- **First-half/later-half change:** later activity-weighted rate minus earlier
  activity-weighted rate.

Average, median, contribution and profit-factor measurements are unavailable
when their required population or denominator is empty. The engine does not
store infinity, substitute zero or invent a display placeholder.

Every visible rate freezes its integer numerator and denominator beside the
exact decimal. The renderer always shows `x of y` adjacent to a percentage; it
never presents a percentage alone. When the denominator is below 20, the count
leads and the percentage is optional. This keeps `2 of 3` from reading like a
stable period-wide `67%` pattern while preserving the exact measurement for
ranking and audit.

Every money measurement records both the full affected population and the
money-eligible subset. A section can say that a pattern appeared on six trades
and that the four with complete P/L lost a stated amount; it cannot describe the
amount as the result of all six. The opening similarly distinguishes completed
trade count from P/L-eligible trade count whenever they differ. In version one,
partial money may be displayed only as exact covered-subset context; it cannot
contribute financial-materiality, financial-improvement, outcome-support or
result/process-divergence points unless every member required by both its
numerator and comparable period denominator has complete same-currency money.
This prevents one selectively covered loser from receiving a 100-point money
score. The candidate remains eligible through count/rate/process dimensions.
Net P/L is labeled as the period total only when every included trade is money-
eligible; otherwise it is explicitly the known P/L among the covered subset.

Money from different or unavailable currencies is never combined. When the
period lacks one comparable currency, financial candidate dimensions become
unavailable and count/rate dimensions remain eligible.

### Financial association, not invented causation

Rule, tag, ticker, time and sequence cohorts establish association. Their
measurements distinguish affected count, affected losing-trade count, cohort
net P/L and losing-trade P/L. They support language such as `this rule was
broken on 6 trades; the 4 losing trades lost USD 2,333, 25% of the period's
losing-trade P/L, and all 6 finished with a net loss of USD 1,900`. They do not support
claiming that all 6 lost when two won, `this rule break cost you USD 2,333`,
`you would have saved USD 2,333`, or another counterfactual causal claim.
Overlapping cohorts never divide, assign or sum the same loss as though each
behavior independently caused it.

For day rules, the whole trading day's result is explicitly outcome context,
not an affected financial cohort. Only the evaluator's typed event-bounded
execution members may enter an after-violation association, comparison or
financial score. A status-only day rule can rank from repetition and process
relevance, with exact day outcomes shown as context, but cannot receive money
rank merely because a broken day finished red.

The visible distinction is direct. Status-only copy may say `You marked Maximum
risk defined broken on 4 of 12 reviewed days; those four days closed with a
combined net result of ...`. Event-bounded copy may say `The evaluator identified
6 completed trades at or after the exact violation boundaries; those trades
finished with a combined net result of ...`. The first is day context, the
second is a bounded cohort association, and neither may use `cost you` or an
avoided-loss counterfactual.

For behavioral friction and strength, gross loss share and gross profit share
are supporting composition facts, not the main money score. A broken-rule
cohort containing USD 2,333 of losing trades and USD 5,000 of winners is net
profitable; it may still rank as repeated process friction, but it receives zero
adverse net contribution and may create a profitable-rule-break contrast. The
mirror rule applies to a followed-rule or tagged cohort whose winners are
outweighed by its losses. Gross loss/profit share remains the correct primary
measure only for an explicitly defined loss/winner concentration or outlier
candidate.

The engine also distinguishes `money present in the affected cohort` from
`outcomes that separate from a comparable opportunity population`. Named-rule
comparisons use broken versus followed outcomes for the same rule/version;
add/exit/Analyzer behavior uses the family-declared affected opportunity versus
its eligible remainder; fixed result cohorts use their already-declared
remainder. With at least five money-eligible observations on each side, a
friction consequence is `worse_associated_outcome` only when the affected side's
loss rate is at least 15 percentage points worse or its median net P/L is lower
by at least 20% of the period median absolute trade P/L. A strength consequence
uses the mirror `better_associated_outcome` gate: win rate at least 15 points
higher or median net P/L higher by the same scale. The declared direction must
survive the candidate's outlier check. Otherwise the verdict is `not_separated`
or `opposite_associated_outcome`. Smaller comparison populations are
`comparison_unavailable`.

When period median absolute trade P/L is zero or unavailable, the median-gap
branch is unavailable and cannot substitute a universal dollar threshold; the
loss-rate branch may still produce a consequence verdict when its populations
pass.

This remains descriptive, not causal. A behavioral candidate receives its full
scale-guarded financial score only for the polarity-aligned worse/better
associated verdict after the comparability gate, half of that score when the
comparison is unavailable, and zero when outcomes are not separated, mixed,
composition-confounded or run opposite to the candidate; its
repeated process/rule evidence and exact cohort P/L remain visible. Explicit
loss/profit concentration and material-outlier families are
exempt because their stated subject is the composition of results, not a claim
that a behavior produced the difference.

Analyzer peak-to-final P/L can be described as measured giveback between the
recorded peak and final result. It is not guaranteed executable profit and must
not be called money the trader could certainly have captured. The provider
brief labels every financial measurement as period result, cohort association
or Analyzer path measurement, and server validation rejects incompatible
causal/counterfactual wording.

### Consequence-comparison comparability

A broken-versus-followed or affected-versus-remainder comparison is not valid
merely because both sides contain trades. Before assigning the consequence
verdict, version one applies fixed pre-result structural strata: exact rule
version/scope, trader-declared style where applicable, historical direction and
calendar-week bucket. Day-rule comparisons use rule version/scope and calendar
week at the day observation unit for adherence/process comparisons. Financial
comparison for a day rule instead uses only its typed event-bounded execution
members and the exact preset-declared comparison set; it cannot standardize or
score full-day P/L as the consequence of a late violation. It never searches
tags, tickers or new intersections after seeing results.

A stratum is material under the same pooled-20% and 15-percentage-point share-
shift thresholds used by improvement mix sensitivity. The engine recalculates
loss/win rates and eligible median direction under pooled stratum weights. If
the standardized direction reverses, the verdict is `composition_confounded`
and supplies no financial-consequence rank. If direction remains but magnitude
changes by more than 50%, confidence is reduced and both raw/standardized values
remain auditable.

Only strata represented on both comparison sides enter standardization. If no
common material population remains or either standardized side fails its family
minimum, consequence comparison is unavailable rather than extrapolated across
disjoint styles, directions or weeks.

When both rate and median-P/L branches are available, a material direction
conflict produces `mixed_outcome_separation`, not the more favorable branch. If
one is neutral and the other qualifies, the qualifying branch may control. A
dollar-median comparison also records median absolute P/L on both sides. When
their ratio is above 2 or below 0.5 and no exact comparable risk/notional/size
fact exists, the dollar branch is `exposure_scale_unavailable`; a valid loss/
win-rate or Analyzer-path branch may still qualify. The review can always show
exact cohort dollars, but it cannot call the result risk-adjusted, size-
normalized, return-on-capital or measured in R without those source facts.

If exactly one median absolute P/L is zero, the scale ratio is treated as
unbounded and the dollar branch is unavailable. If both are zero, the dollar
branch is neutral rather than comparable evidence.

## Scoring dimensions

Every dimension is clamped to an integer from 0 to 100 and stored with its raw
inputs, unclamped intermediate value and explanation. Dimension values round
half away from zero only after the raw dimension calculation. A subscore that
explicitly reweights applicable components uses
`sum(weight * component) / sum(applicable weights)`. Lane scores keep their
fixed 100-point weights and use `sum(weight * available dimension) / 100`;
unavailable dimensions contribute no lane points and the available-weight
total remains visible. This prevents missing financial evidence from increasing
a candidate's score merely through redistribution. Round the lane score half
away from zero once, subtract integer post-lane penalties and clamp at zero. A
candidate with no available weighted dimension is ineligible. Ratios such as
measured peak-to-final giveback may exceed 100% in the source evidence; the raw
ratio is retained for display and audit even though the score contribution is
capped.

### Financial materiality

For negative behavioral candidates, the polarity-pool component is adverse net
contribution. For positive behavioral candidates, it is beneficial net
contribution or protected measured profit. Explicit loss/winner concentration
and outlier families use gross loss/profit share because their subject is the
composition of losses or winners rather than the net result of a behavior.
Giveback candidates use measured reversal relative to the Analyzer-covered
peak-profit population. Exact dollars and raw gross loss/profit/path shares
remain important displayed measurements.

`day_outcome_context` is never an input to this dimension. A day-rule candidate
can receive financial materiality only from its validated typed affected-
execution cohort; without one, the money dimension is unavailable rather than
filled by full-day P/L.

A polarity pool can be tiny, so `100% of losses` cannot automatically earn a
100 money score when the entire loss was trivial beside the month's winners.
Version one pairs the family-declared pool share with the same exact dollar
amount divided by period absolute P/L magnitude. Each scoring input is clamped
to `[0,1]`; the scale-guarded share is their harmonic mean,
`2 * poolShare * periodMagnitudeShare / (poolShare + periodMagnitudeShare)`, or
zero when both are zero. The financial-materiality score is that share times
100 before the behavioral consequence adjustment above. This has no universal
absolute-dollar threshold and remains comparable across account sizes while
preventing a nearly empty positive/negative pool from manufacturing dominance.

The component is unavailable, not fabricated as zero, when comparable money is
unavailable. Other dimensions remain eligible, but the missing financial weight
does not redistribute and inflate the lane score.

The family still fixes the exact polarity/path pool and amount in
`engineVersion`; it cannot choose whichever denominator yields the largest
score. Both raw shares, the harmonic-mean intermediate and any consequence
factor remain visible in the audit. When period absolute P/L magnitude is zero
or unavailable, the money dimension is unavailable rather than replaced by the
unscaled pool share.

### Repetition

The default repetition score combines:

- 45% family-declared opportunity rate when the behavior has an opportunity
  state, otherwise period prevalence;
- 35% count saturation, reaching full credit at the versioned adaptive target
  `max(3, min(20, ceil(eligible population * 0.10)))`;
- 20% cadence-appropriate independent spread.

This prevents eight observations in a 420-trade month from receiving the same
count credit as eight observations in a 20-trade month, while still recognizing
a repeated pattern in a smaller period. A family-specific override requires a
versioned fixture-backed calibration record. Explicit outlier and single-
example candidates receive a repetition score of zero regardless of their
affected-rate or spread inputs.

### Trend magnitude

Trend uses activity-weighted early and later rates, supported by the complete
weekly series. A 25-percentage-point direction-aligned change reaches the
default full magnitude score: a decrease for `lower_is_better`, an increase for
`higher_is_better`, and no improvement score for `context_only`. Smaller
changes scale proportionally. Money and count changes remain supporting
measurements rather than being silently mixed into the rate.

Trend consistency separately records how many intermediate week-to-week moves
support, contradict or remain flat against the overall direction. It stores
both the raw bucket sequence and eligible-observation weight; the score uses
the latter so a one-day partial week does not receive the same evidentiary
weight as a full high-activity week. Visible prose calls a partial bucket a
partial week and states its exact eligible count.

### Process relevance

Version-one uses a fixed structural table:

- 100 for an exact preset risk, stop, sizing, re-entry, exit or daily-boundary
  rule family;
- 90 for another exact named rule or exact hidden tracked-focus subject;
- 80 for an Analyzer execution behavior corroborated by an applicable named
  rule;
- 70 for an Analyzer-only entry/add/exit/path behavior;
- 55 for an exact chronology/sequence behavior without a named rule; and
- 35 for a ticker, tag, direction, weekday, time or duration result cohort with
  no structured behavior link.

The highest structurally eligible row applies. A custom rule title, tag or note
cannot move a candidate to a higher row through keyword guessing.

### Evidence confidence

Version-one confidence combines only applicable deterministic components:

- 30% required-field coverage: observed eligible records divided by the
  family's expected eligible population, using the lowest material fixed-
  stratum coverage when the optional-evidence balance gate applies;
- 25% sample sufficiency: the minimum sufficiency across every population the
  family requires, using `min(100, 50 * actual member count / declared minimum)`
  for each; a just-passing population receives 50 and twice its minimum receives
  100;
- 20% cadence-appropriate independent spread;
- 15% outlier resistance: the share of the candidate effect that remains after
  removing its largest absolute contributor; and
- 10% structured-source consistency when the family expects two independent
  structured sources.

The family contract names those required populations. A one-cohort pattern uses
its affected primary-observation population and any required opportunity
denominator. A cohort comparison uses both cohort and remainder. An improvement
uses early and later populations, and a rate claim also includes its affected-
count minimum. The weakest required side controls the component. A five-trade
tag inside a 420-trade month therefore cannot receive perfect sample confidence
merely because the overall comparison population is large.

`Outlier resistance` is not a generic phrase. Each family declares one signed
numeric `effectStatistic` and its contribution unit. The engine recomputes that
statistic after removing (a) the single primary-observation member with the
largest absolute contribution and (b) each cadence-appropriate independent
bucket one at a time. Its resistance score is the smallest direction-preserving
`100 * abs(reduced effect) / abs(original effect)`, capped at 100. It is zero if
any required removal reverses direction or makes the family fail its hard gate,
and unavailable when the original effect is exactly zero. Explicit one-off
outlier/example candidates retain their separate classification and cannot use
this component to pretend recurrence or robustness.

Unavailable confidence components reweight under the common weighted formula.
Currency/fee absence makes a money dimension unavailable and is not also a
confidence penalty. Free-text notes can explain an already-selected finding but
cannot raise or lower deterministic confidence because this engine does not
classify their meaning. Disagreement between structured rule and Analyzer facts
lowers source consistency and may create a useful mixed or contrast candidate.

### Focus relevance

An exact hidden focus-tracking subject match receives 100. A structurally
matched legacy focus receives at most 60. General prose similarity alone
receives zero.

### Specificity and usefulness

Version-one specificity is additive and capped at 100:

- 30 points for an exact named/structural behavior subject, or 15 for a fixed
  result cohort rather than a broad outcome;
- 25 points for an exact eligible denominator;
- 20 points for at least one eligible representative trade/day;
- 15 points for an exact sequence or comparison definition; and
- 10 points for a measurable future tracking target.

Duplication is handled by overlap merging/penalties and is not scored again as
specificity.

### Remaining lane components

Every other named lane component is also deterministic:

- `persistence or adverse trend` is the larger of later-window repetition and
  direction-aligned adverse trend magnitude;
- `financial improvement` is direction-aligned median-per-opportunity money or
  Analyzer-path improvement, with a 50% relative improvement receiving 100;
  it is unavailable for a zero/non-comparable baseline;
- `baseline recurrence` is the repetition score calculated on the frozen
  baseline population;
- strength `process relevance` uses the process-relevance table above;
- strength `outcome support` is beneficial complete-cohort net contribution or
  measured favorable-path retention. It is unavailable, rather than zero, for
  a rule-followed losing-trade strength because planned risk is not an accepted
  input;
- `cross-period consistency` is supporting independent buckets divided by
  eligible independent buckets;
- `result/process divergence` is the smaller of the result-polarity score and
  process-polarity score, ensuring both sides of a contrast are material. The
  result side uses the complete cohort net polarity's adverse/beneficial
  materiality when available, otherwise the exact win/loss outcome rate; it
  cannot choose gross winners or losers that contradict cohort net. The process
  side uses the applicable followed/broken rule rate or structured Analyzer
  behavior rate;
- `exact focus measurability` is 100 for hidden tracking metadata, at most 60
  for a structural legacy match and zero for prose similarity;
- `later-evidence span` reaches 100 at three eligible independent later
  buckets and scales proportionally below that; and
- focus change/financial relevance reuse trend magnitude and financial
  materiality rather than introducing new formulas.

## Lane formulas

Weights are defaults to calibrate against planted fixtures. They are versioned
and inspectable rather than hidden in provider discretion.

### Friction priority

- 30% financial materiality;
- 25% repetition;
- 15% process relevance;
- 15% evidence confidence;
- 10% persistence or adverse trend;
- 5% earlier-focus relevance.

If money is unavailable, the other dimensions can still contribute up to 70
points; the missing 30 points remain visible as unavailable evidence.

### Improvement priority

- 35% trend magnitude;
- 20% financial improvement;
- 15% baseline recurrence;
- 15% earlier-focus relevance;
- 10% evidence confidence;
- 5% specificity.

### Strength priority

- 25% process relevance;
- 25% repetition;
- 20% outcome support;
- 15% cross-period consistency;
- 10% evidence confidence;
- 5% earlier-focus relevance.

### Contrast priority

- 30% result/process divergence;
- 20% financial materiality;
- 20% repetition;
- 15% process relevance;
- 10% evidence confidence;
- 5% specificity.

### Focus follow-through priority

- 35% exact focus measurability;
- 25% later-evidence span;
- 20% magnitude of later change;
- 10% financial relevance;
- 10% evidence confidence.

Lane ties resolve deterministically by post-penalty score, evidence confidence,
available financial materiality, repetition, process relevance, specificity
and a server-owned structural `rankTieKey`, in that order. The tie key is a
canonical serialization of non-secret candidate semantics: family priority,
polarity, subject kind/template key or typed custom definition, cohort,
comparison and representative-evidence ordering. It excludes HMAC output,
account/user identity, note prose and provider text. A stable private source
identity is permitted only as the final collision guard for two otherwise
identical definitions and is never exposed. HMAC key rotation therefore cannot
change ranks. Provider output never breaks an engine-rank tie.

## Gates, adjustments, penalties and sensitivity checks

The engine must not subtract the same weakness twice. The order is explicit:

1. Eligibility gates mark invalid populations ineligible before lane scoring.
   This covers wrong-period evidence, incompatible rule versions, missing
   required comparisons and populations below a hard family minimum.
2. Dimension availability suppresses only the unavailable dimension. Mixed
   currency suppresses combined money scoring; it does not create an extra
   penalty or delete valid count evidence.
3. Evidence confidence incorporates field coverage, independent spread,
   outlier dependence, structured-source disagreement and weak comparison
   populations.
   Those facts do not receive another post-score subtraction.
4. Only exploratory multiplicity and unresolved cross-family duplication use
   an explicit post-lane penalty.

After those steps, each lane records how clearly its selected default separates
from the next distinct visibly eligible candidate. `dominant` requires the
selected default to be the post-penalty lane leader by at least five points and
to remain first in the family-declared leave-one-independent-bucket check.
`near_tie` applies when the margin is below five, the sensitivity winner
changes, or the measured-consequence guard deliberately selects a useful
candidate below the raw leader. `only_eligible` is separate from dominance: one
available candidate does not prove that it was a uniquely important behavior.
These provisional boundaries affect certainty wording, never measurements or
the deterministic winner.

The renderer may use a ranking superlative such as `the biggest issue` only for
`dominant`. A near tie or sole eligible finding starts directly with the exact
behavior and impact, without a ranking phrase, and cannot imply the engine
proved one exclusive cause. Provider alternatives cannot change this rank-
certainty state.

The version-one exploratory multiplicity schedule is 0 points for at most five
non-empty sibling groups, 5 points for 6-10 groups, 10 points for 11-25 groups
and 15 points for more than 25 groups. It applies only to ticker, tag, weekday,
time, duration and RSI-context cohort candidates. The version-one
unresolved-overlap schedule is 0 points below 35% evidence overlap, 5 points at
35-49%, 10 points
at 50-64% and 15 points at 65% or more when two cross-family candidates cannot
be merged without losing a materially distinct finding. The stronger candidate
keeps its score; the lower-ranked duplicate receives the subtraction.

Exploratory cohort families must record the number of non-empty sibling groups
tested under the Segment gate definition. Their minimum sample, independent-
spread and largest-contributor limits
use the exact Segment gate schedule above. The engine does not claim a stable
pattern from the best-looking member of dozens of tiny tags or tickers merely
because one happens to have extreme P/L. Every exclusion, unavailable
dimension, confidence adjustment and post-lane penalty is separately named in
the audit record with its inputs and pre/post value.

## Overlap and candidate merging

Each candidate retains its affected trade/day reference set and semantic
overlap keys. Candidates are first clustered by those keys and collapsed within
family/subject. At most the top 50 remaining candidates per lane enter pairwise
evidence-set overlap calculation; lower-ranked candidates remain in the private
audit snapshot but cannot enter the provider shortlist. This keeps overlap work
bounded on months with many rules, tickers or tags.

Version one uses an exact containment coefficient for merge and penalty
thresholds: `intersection size / min(left size, right size)`. Empty sets have
zero overlap. Trade candidates use contributing trade-reference sets; day-only
candidates use day-reference sets. A day and trade candidate can be compared
across granularities only when the day measurement retains its exact
contributing trade set, in which case both sides use trade references. The audit
also records Jaccard overlap, `intersection / union`, for diagnosis, but Jaccard
does not drive version-one thresholds. The 35%, 50% and 65% schedules above all
refer to the containment coefficient.

- Candidates in the same family and subject with at least 65% evidence overlap
  collapse into the stronger candidate.
- A narrower rule candidate may merge into a broader giveback candidate when
  both describe the same measured rule-and-trade evidence. Overlap alone never
  establishes that the rule caused the giveback.
- Different rule findings remain separate even when some trades overlap.
- A candidate cannot claim the sum of P/L from overlapping cohorts.
- The provider shortlist normally uses a trade in no more than two visible
  sections. The opening may reuse the main section finding.

After merge decisions, the remaining candidates form deterministic
`evidenceClusterRef` components using the 65% containment edge and receive an
`actionTargetKey` for the exact rule, tracked focus, Analyzer behavior or fixed
cohort the trader could review. These are diversity controls, not causal labels.
The ordered shortlist reserves every eligible lane default first. The two-per-
cluster and two-per-action-target caps then apply to alternatives and supporting
candidates; they cannot silently remove an already recorded lane default. A
default collision is retained for audit and resolved by the later complete-plan
overlap rules rather than falsifying the lane selection. Section alternatives
scan rank order for a different evidence cluster and action target before taking
a second candidate from either. A same-cluster alternative is allowed only when
no distinct candidate is within 10 lane-score points and five confidence points
of it. This prevents differently labelled findings on the same losing trades
from crowding every useful alternative out of the model's choice set.

Representative evidence is selected by an explicit role rather than taking only
the most dramatic affected trades:

1. highest material contribution;
2. closest-to-median affected example;
3. closest-to-median comparison or contradicting example; and
4. most recent independent example.

Friction normally uses impact plus typicality. Improvement uses one typical
early and one typical later member. Mixed/contrast findings require one typical
supporting and one typical contradicting/remainder example when both exist.
Strength uses typicality plus an independent recent example. This prevents every
section from citing only the largest loser and prevents a mixed result from
showing only evidence for one side.

The candidate declares the exact representative metric before examples are
selected. Its median uses sorted exact-decimal values: the middle value for an
odd population and the exact arithmetic mean of the two middle values for an
even population. `Closest-to-median` minimizes exact absolute distance inside
the role's own affected/comparison population. Ties in every representative
slot resolve by exact event timestamp, normalized
ticker, historical direction and the non-secret structural evidence key; they
never depend on input array order or a rotating scoped reference.

## Shortlist construction

The internal candidate list may be long. The provider receives a deduplicated
brief of approximately 15-25 candidates:

- up to six friction candidates;
- up to four improvement candidates;
- up to four strength candidates;
- up to three contrast candidates;
- up to four measurable focus-follow-through candidates.

Unused quota can move to another lane, but friction, improvement and strength
each retain at least one candidate when a visibly eligible candidate exists.

`Visibly eligible` is stricter than merely having a calculable score. Recurring,
trend and contrast candidates require evidence confidence of at least 50 plus
their complete family gate, one exact actionability anchor and a renderer-
supported factual job. Single examples and material outliers use their explicit
narrow classifications instead of bypassing that floor. Follow-through requires
an exact/structural focus match, eligible later evidence and a measurable verdict.
If a lane has no visibly eligible candidate, its section plan uses the specific
server-owned no-pattern/unchanged/mixed form and the best distinct concrete
example when one exists; it cannot promote a weak candidate merely to fill a
quota or emit generic advice.

The brief includes lane rank and a `requiredConsideration` tier:

- the engine identifies one default selection for friction, improvement,
  strength and follow-through before the provider call;
- the held-back default applies a measured-consequence guard: when a full (not
  comparison-halved) scale-guarded financial/path score of at least 10 exists,
  passes visible confidence and is within 10 lane points of the raw friction
  leader, the highest-ranked such candidate becomes the default; a materially
  grounded problem cannot be displaced by a slightly higher-scoring but
  consequence-free process count;
- the engine precomputes each section's bounded alternatives from the top three
  diversified visibly eligible lane candidates using the score, confidence,
  evidence/action-target cluster, overlap, focus and specificity rules; the
  later review-plan builder cannot nominate another candidate or reason;
- `What held you back` and `What improved` use their default unless one of
  those frozen alternatives appears in an authorized complete review plan;
- if no improvement qualifies, the engine supplies a specific unchanged or
  mixed comparison with its weekly series, followed by a concrete execution or
  maintained strength when one exists; generic `no clear improvement`
  boilerplate is not a complete section;
- a genuine strength must appear in the opening or improvement section when a
  high-confidence strength exists; placing it only in a future focus does not
  count as recognizing it;
- follow-through removes candidates with no new evidence since their last
  assessment, then uses the highest-ranked candidate while applying the exact
  within-10-point unassessed-focus preference and consecutive-repeat exception.

The brief also includes the server-computed `laneRankStability` and its exact
margin/sensitivity inputs. It is not a provider judgment and cannot be upgraded
by a selection rationale.

Raw notes and compact evidence remain available after the brief for context,
but the model is not asked to recalculate the ranked measurements.

### Global section and review plans

The provider cannot independently mix individually valid findings into a weak
whole. The server first creates at most three plans for each visible section:
one default and up to two engine-authorized alternatives. A section plan owns
its purpose, exact ordered claim roles, no more than two fact clauses, at most
one bridge clause and its final rendered text. `claimRefs[]` inside a section
plan is the only claim list; there is no second provider-supplied
`sectionClaims[]` representation that could disagree with it.

The server then evaluates the exact bounded product of opening, improvement,
held-back and follow-through plans. With at most three plans for each of four
sections, there are at most 81 combinations. It rejects global conflicts, adds
the deterministically derived focus targets/questions, orders every surviving
combination and retains at most six complete plans. Exhausting this small fixed
space prevents an early beam from discarding the only later-compatible plan and
still forbids unbounded search.

Every complete plan must satisfy all of these global checks before the provider
package exists:

- each section has its distinct required job and minimum evidence role;
- its exact period outcome, primary improvement subject/verdict, primary held-
  back action target and follow-through target match the deterministic
  `decisionCriticalSpine` (including an explicit unavailable value);
- improvement and held-back cannot select the same finding, purpose and primary
  measurement;
- repeated evidence and subjects obey the cross-section overlap limits;
- a required genuine strength appears in the opening or improvement section;
- no two rendered clauses repeat the same factual job;
- focus questions are distinct and compatible with the selected findings;
- incomplete-record language matches the exact coverage state; and
- rank-certainty wording matches the frozen lane stability and never calls a
  near tie, guard-selected candidate or sole eligible candidate `the main`
  issue; and
- every final visible field fits the output and sentence budgets below.

The default review plan is the first globally valid plan under the section
defaults and deterministic conflict resolution, and it freezes the
`decisionCriticalSpine`. Other plans are ordered by
least total lane-score loss from those defaults, then greater overlap reduction,
stronger focus connection, greater specificity and finally a non-secret
structural plan tie key. The provider receives the deduplicated section-plan
catalog, no more than six complete plans labelled with request-local
`providerChoiceKey` values and their bounded server-owned selection rationales.
It selects one whole plan or the attempt fails; it cannot return a new
combination. The key-to-`reviewPlanRef` mapping remains private and no internal
digest is exposed merely for the model to copy.

When exactly one complete plan survives, there is nothing for the provider to
narrow. After normal feature activation, provider configuration and request
authorization, the coordinator issues that plan directly as
`deterministic_default` with reason `single_authorized_plan`; it creates no
provider attempt or receipt. Two-to-six plans use the ordinary provider-
selection path and retain the same frozen first plan as operational fallback.

These plan-order terms are exact. Total lane-score loss is the sum, across the
four sections, of each default post-penalty lane score minus its replacement
score, floored at zero per section. Cross-section overlap burden is the sum of
the already-defined containment coefficients for every eligible pair of primary
evidence sets; lower burden is better. Focus connection and specificity are the
sums of their existing versioned candidate components. No display rounding is
used. Ties use the ordered structural section-plan keys and focus-target
semantic keys, never HMAC output or rendered prose.

Ordering alone is not enough to make every retained alternative useful. The
default always remains first. A non-default complete plan may enter the final
catalog only when its total lane-score loss is at most 12 points and it provides
at least one exact compensating benefit over the default: overlap burden falls
by at least `0.20`, total focus-connection score rises by at least 10 points, or
total specificity score rises by at least 10 points. It must also retain the
existing per-section ten-point lane-loss and five-point confidence-loss limits.
These version-one thresholds are part of the engine version. A merely different
but weaker plan is not sent to the provider. This bounds prompt injection or
provider variability to a set of near-equivalent, independently acceptable
reviews rather than allowing the sixth-ranked plan to be materially worse.

A non-default plan also cannot change the decision-critical spine. Its
compensating benefit may change only a supporting strength/contrast,
representative evidence role, bridge or the ordering of already-authorized
distinct focus questions. This ensures that sending all four weekly reviews to
the provider improves continuity without letting stale narrative wording change
what the current exact month says improved or held the trader back.

After final plan ordering, the package assigns `plan_1` through `plan_6` as its
only possible `providerChoiceKey` values and freezes the exact key-to-
`reviewPlanRef` mapping. Because `plan_1` alone is not request proof, the package
also includes a 128-bit base64url `providerPackageKey`. It is a versioned HMAC
over the request, period, source-snapshot digest, selection-schema version and a
canonical selection-payload digest calculated before the package key is added;
no private identity or HMAC material is exposed. The final canonical package
digest then includes the key. A choice is valid only when both keys match that
frozen request package. Reusing a response or private plan reference from
another request fails even when the two visible reviews happen to contain the
same words.

The snapshot table enforces global uniqueness for `providerPackageKey`; a
mocked collision fails request creation as an integrity defect rather than
silently accepting an ambiguous replay token. The key is correlation evidence,
not authentication: account scope, entitlement, feature state, the persisted
selection lease and issuance compare-and-set remain mandatory. Retries compare
the returned key with the frozen literal and never recompute it with a current
HMAC secret. Key rotation therefore cannot invalidate a pending saved package.

Each claim also carries a `factualJobKey` derived from claim kind, subject,
primary metric, population/comparison definition and attribution kind. Global
nonduplication compares those keys and exact rendered-clause digests; it does
not rely on a fuzzy prose-similarity threshold. The same subject may still serve
improvement and held-back only through different purposes, primary metrics and
factual-job keys.

The single `incompleteRecord` sentence owns the review-wide coverage-limitation
job. Individual fact clauses still state measurement-local denominators and
covered subsets, such as `among 4 of 6 affected trades`, but cannot repeat the
generic record limitation in another section. A versioned `coverageJobKey`
participates in global nonduplication so the limitation is rendered exactly
once without suppressing necessary local denominator language.

Confirmed positions open at period end use the same job: the sentence states
that the displayed result is from closed trades and excludes unrealized P/L on
the exact open-position count. When Analyzer/rule/money limitations also exist,
the renderer combines the bounded clauses into that one ordered sentence rather
than omitting the open-position boundary or creating multiple generic warnings.

### Renderer and visible-output boundaries

The renderer produces plain text, not Markdown or HTML. Version one targets no
more than three sentences in each narrative section, one sentence per focus and
one deterministic coverage sentence in `incompleteRecord` when required.
Every fact and bridge template emits exactly one sentence, so this budget is
counted structurally rather than by guessing from punctuation in labels.
It must also preserve the current hard maximums when creating the new output
contract: the current v2 narrative/focus maximums plus explicit v3
`incompleteRecord` maximums aligned with the legacy coverage boundary. Hard
field limits are counted exactly like the runtime string schema (JavaScript
UTF-16 code units); grapheme limits below are a separate display-quality rule:

- periodic/two-week: 1,800 characters for the opening, 1,500 for each other
  narrative section, 280 for each focus and 1,000 for `incompleteRecord`;
- monthly: 2,400 characters for the opening, 1,800 for each other narrative
  section, 280 for each focus and 1,200 for `incompleteRecord`.

The renderer never cuts a sentence, number, label or claim to make it fit. It
selects a shorter authorized clause plan before the provider package is frozen;
if no globally valid plan fits, snapshot creation fails with a renderer defect
rather than issuing truncated or incomplete prose.

All user-authored labels are whitespace/control-normalized only for display and
remain unchanged in stored evidence. A label longer than 80 Unicode grapheme
clusters is rendered as an explicitly partial label such as `the custom rule
beginning ...`; that display form never becomes identity or scoring input. A
note may appear only as a complete, output-safe exact excerpt of at most 180
grapheme clusters. If no complete safe excerpt fits, the renderer omits the note
without discarding the measured finding.

Count grammar, singular/plural forms, signs, currency availability and partial-
coverage phrases are renderer-owned. Exact zero always displays as zero rather
than negative zero, and sign-aware clauses cannot produce forms such as `lost
-$200` or call a covered-subset result the period total. Every complete plan is
run through the existing trading-direction/internal-language safety boundary
and the new semantic reference validator before it can enter the shortlist.

Rate templates always retain their count and denominator. Below 20
opportunities, the count leads and the percentage may be omitted to prevent a
small sample from sounding more settled than it is. Rank-language templates
are separately keyed by `dominant`, `near_tie` and `only_eligible`; there is no
generic superlative template.

The renderer has a versioned coverage registry, not a generic
`subject + metric + result` fallback. Every candidate family, section purpose,
claim kind, attribution kind, availability state and required currency/
coverage variant must map to an explicit fact or bridge template before that
combination can become visible. Custom rule and tag labels are inserted only as
quoted noun labels; their text can never become a verb, instruction or grammar
fragment. Adding or changing a family/template combination requires a renderer
version change and the complete grammar, sign, currency, partial-coverage and
output-safety fixture matrix.

During development, a candidate whose otherwise-eligible combination has no
template remains audit-visible with `renderer_template_unavailable`. Production
snapshot creation treats that as a renderer coverage defect and fails closed;
it cannot silently discard the candidate, report `no_qualifying_pattern` or
fall through to a generic sentence. A catalog-completeness verifier proves that
every activatable family/role/variant has safe templates before the engine
version can be activated.

## Immutable persistence and atomicity

The existing v2 output contracts are frozen to the old prompt version, and the
current issued-review table records every output as `openai_direct`. Neither can
truthfully represent the insight renderer or a deterministic-default issuance.
The implementation therefore does not reuse the old prompt marker, omit it, or
mislabel a server-rendered review as provider-authored.

A forward-only Coach migration adds the insight snapshot, provider-dispatch,
dispatch-recovery-state, generation-contract-state and selection-audit tables
plus a new immutable v3 issued-review table. New periodic and monthly v3 output
contracts retain the same visible fields while using new contract and prompt/
renderer versions. The existing customer read model and page read v2 and v3
rows into the same visible shape; every already-issued v2 row remains unchanged.

The planned table identities are `coach_ai_review_insight_snapshots`,
`coach_ai_review_insight_provider_dispatches`,
`coach_ai_review_dispatch_recovery_state`,
`coach_ai_review_generation_contract_state`,
`coach_ai_review_insight_selection_audits` and
`coach_ai_issued_reviews_v3`. The four review/request tables carry the request's
account scope and participate in erasure. The recovery-state and generation-
contract-state tables are database-wide singletons, carry no account facts and
are never erased with one account. All six participate in administration,
backup/restore and integrity verification. Snapshot, selection-audit and issued rows reject ordinary
updates/deletes. A dispatch row permits only the fenced lease/dispatch/
settlement transitions defined below, becomes immutable when fully settled and
always rejects ordinary deletion. The recovery singleton permits only the
restore/startup epoch transition defined below and cannot be deleted.
The generation singleton permits only the verified one-way v2-to-v3 activation
and reader-compatibility-floor transitions defined below and cannot be deleted.

The exact new output identities are
`traderlink_coach_periodic_ai_review_output_v3` with
`periodic_insight_v1_renderer_v1`, and
`traderlink_coach_monthly_ai_review_output_v3` with
`monthly_insight_v1_renderer_v1`. Each JSON object contains those required
version fields, `reviewSummary`, `whatImproved`, `whatHeldYouBack`,
`focusFollowThrough`, one-to-three `nextPeriodFocuses` and the server-owned
nullable `incompleteRecord`. Generation source and private plan references stay
in the scoped issued/selection rows rather than leaking into visible copy.

The v3 issued row records `generationSource` as `provider_selected` or
`deterministic_default`. Provider/model identity is required only for
`provider_selected` and is null for a deterministic default. The existing
request's issued-review integrity trigger is replaced by a scoped trigger that
accepts exactly one matching immutable v2 or v3 issued row. It cannot accept a
cross-account row or both versions for one request.

### Generation-contract cutover and rollback

The existing request table name remains
`coach_ai_review_period_requests_v2`, but its current
`input_contract_version` permits only the existing v2 input contracts and does
not tell a worker which generation/output path owns the request. The forward
migration therefore rebuilds that table and
`coach_ai_review_generation_attempts_v2` with required, immutable
`generation_contract_version` columns that have no insert default. Existing
rows are backfilled as `openai_direct_v2`; new insight requests and attempts use
`insight_selection_v3`. The historical input contract may remain v2 because
the new private insight snapshot carries the additional normalized calculation
source, but generation ownership is never inferred merely from snapshot
presence or current code.

The new `coach_ai_review_generation_contract_state` singleton is the
authoritative activation marker. It begins at `openai_direct_v2`, records the
minimum compatible reader contract and may advance once to
`insight_selection_v3` only after the cutover verifier passes. Request creation
reads that row inside its atomic insert transaction; it never selects a
generation contract from deployment time, process memory, feature-control age
or the request's reviewed period.

Rebuilt scope/transition triggers enforce all of the following:

- a v2 request can create only a v2 attempt and exactly one v2 issued row;
- a v3 request can create only a v3 attempt/dispatch and exactly one v3 issued
  row;
- neither output family can be attached to the other generation contract;
- an old binary that omits the required no-default contract column fails before
  it can create a request or attempt; and
- one account/period identity still owns one immutable request. If that identity
  already exists as v2—pending, issued, failed or stopped—request creation
  returns it unchanged and never grafts on a v3 snapshot or upgrades history.

Cutover is a single-node maintenance boundary, not a rolling mixed-writer
deployment. Stop new automatic/manual request intake, let every existing v2
request, attempt and reservation reach a reconciled terminal state, verify each
billable attempt's receipt or explicit no-usage state, and require zero pending
v2 work before proceeding. If zero cannot be proven, abort activation rather
than guessing whether an old provider call occurred.
Once zero is proven, disable both platform AI Review feature controls, take and
verify the normal evidence backup, stop every old app/worker process, migrate,
start only the v3-capable binary, reconcile byte-for-byte row counts/digests/
triggers and v2 reads, and
only then advance the generation singleton to v3 and re-enable request intake.
The singleton transition precedes feature-control enablement, so no request can
be created in the gap under v2. The first monthly v3 review may legitimately
contain a mixture of already-issued v2 and v3 weekly reviews; all are included,
while hidden follow-through metadata remains unavailable for v2 history.

The rebuilt feature-control guards reject re-enabling weekly or monthly AI
Reviews while the singleton remains in cutover v2 state. This internal
compatibility guard does not replace the existing account/platform feature
switches; after verified v3 activation those switches retain their ordinary
authorization and operational-kill behavior.

Once any v3 row exists, a v2-only binary is below the database's reader/writer
compatibility floor. Operational rollback may disable generation and run the
last v3-capable reader or deploy a forward fix; it may not reinstall a v2-only
binary, down-migrate, delete v3 history or restore an older database that loses
issued reviews. The activation report records the first v3 request and issued
row so this boundary is unambiguous.

### Insight snapshot

One account-scoped insight snapshot is created atomically with each new period
request and contains:

- request reference and source input/evidence digests;
- full normalized prompt-safe calculation source JSON and digest, including
  complete exact-month eligible Analyzer evidence, prompt-safe trade-style
  revisions and linked dated Swing-note context;
- prompt-safe reference derivation version, never HMAC key material;
- insight-engine version;
- renderer, section-plan, review-plan and provider-selection schema versions;
- frozen provider key/model ID, selection-instruction bytes/digest, strict
  structured-output schema bytes/digest, provider-envelope version and safe-
  context/token-count profile, never credentials or API secrets;
- frozen provider-invocation manifest/digest: versioned adapter, API family,
  official endpoint identity, exact installed AI SDK/provider versions,
  non-streaming one-call mode, timeout, retry count, storage/telemetry/tool/
  continuation settings and every supported behavior/cost-affecting model
  option, never the API key or authorization header;
- complete eligible candidate JSON and digest;
- frozen observation-unit membership sets, temporal-ownership decisions,
  style-coverage state, source-lineage checks and sensitivity results;
- frozen long-term Analyzer projection with every calculated aggregate,
  coverage denominator and week series plus only the authorized representative
  excerpts; bulk raw one-minute/five-minute records remain solely in the
  calculation source;
- balanced shortlist and deduplicated section-plan catalog JSON/digest;
- all authorized fully rendered review-plan outputs, their digests and the
  deterministic-default `reviewPlanRef`;
- frozen `providerPackageKey` and ordered request-local `providerChoiceKey` to
  `reviewPlanRef` mapping;
- exact canonical provider-package bytes, byte digest, selection instruction/
  schema versions and output allowance;
- calculation coverage and created time.

The table is keyed one-to-one to `coach_ai_review_period_requests_v2`, carries
the same user/workspace/account scope, has restrictive foreign keys and rejects
updates or deletes. Request creation first copies the normalized source under
the consistent read transaction defined above, closes that transaction, and
computes the pure candidate snapshot outside it. A short write transaction then
inserts the request and completed insight snapshot together. An idempotent
period-identity race must return the request and snapshot that won the insert.
A losing concurrent calculation is discarded even if Journal state changed
while it was being built and its digest differs; it cannot replace or partially
combine with the saved snapshot. No provider or ranking work holds a database
read or write transaction open.

The calculation source contains only the fields needed to reproduce candidate
measurements and evidence selection. A note or Analyzer record is stored once
and referenced by candidates rather than copied into every candidate. The full
private source may be larger than the provider package because it retains
engine-only reproduction identities and structures that are never exposed. The
provider receives one exact prompt-safe projection of every permitted factual
record, not the private IDs or repeated candidate copies. Storing only a digest
would be insufficient because later Analyzer revisions could no longer
reproduce the monthly calculation. Storage-size verification must measure this
snapshot separately from provider-token cost; implementation cannot add an
arbitrary new refusal limit before that benchmark exists.

Large canonical artifacts are stored as versioned compressed BLOBs rather than
duplicated uncompressed SQLite text. Identity always uses the canonical
uncompressed byte length and SHA-256 digest; codec output is storage only and
cannot change a reference. Each read uses bounded streaming decompression,
emits no more than the recorded uncompressed length and verifies both length and
digest before parsing. Corruption, trailing bytes, an unknown codec or a size
mismatch fails closed. Snapshot-size benchmarks must cover compressed and
uncompressed bytes, compression/decompression time, peak memory, annual
retention growth and backup/restore size for the 10-, 80-, 100- and 420-trade
profiles. The implementation cannot keep redundant raw text columns beside the
same compressed artifact merely for convenience.

### Provider envelope pinning and configuration drift

Request creation requires the normal active provider configuration and freezes
the non-secret provider/model/envelope contract listed above. Every attempt for
that request uses those exact instruction, schema, package and model identities;
a deployment or settings edit cannot substitute a different model, provider,
prompt, schema or context profile. Current pricing is still snapshotted by each
real attempt's immutable reservation/receipt so a later price change is recorded
truthfully rather than backdated into the request.

Before each attempt and before deterministic issuance, the coordinator rechecks
account scope, entitlement, the account's AI Review feature control and the
platform AI Review feature control. Disabling either control—including an
operational kill action—or revoking entitlement fails closed and cannot be
bypassed by the default. By contrast, ordinary operational drift after a valid
snapshot—such as the pinned model becoming unavailable or a still-active
configuration moving to a newer model—never rewrites the request or silently
fails over. If the request remains fully authorized and both controls remain
enabled, it uses the frozen deterministic default with
`provider_configuration_drift`; otherwise it remains stopped/failed under the
controlling gate. Missing/invalid provider configuration at request creation
still prevents snapshot creation.

The context check uses the pinned envelope and the more restrictive of its
frozen safe limit and any current authoritative limit for that same model. A
retry reads the stored instruction/schema/package bytes and compares the
returned package key with the stored literal. It does not re-render, rebuild or
re-HMAC an old request with current code or secrets.

### Provider invocation manifest and Railway portability

The installed `ai` and `@ai-sdk/openai` packages are ordinary host-neutral Node
dependencies despite the Vercel AI SDK name. They run inside the Railway app and
call OpenAI directly; this design does not require Vercel hosting, Vercel AI
Gateway or another Vercel service. Railway acceptance still requires the
approved Node runtime, outbound TLS/DNS to OpenAI, `OPENAI_API_KEY` in Railway
secrets, persistent SQLite `/data`, the single authoritative app/worker process
and the separate OpenAI API/data-control launch gates already recorded in the
AI Review beta handoff.

The source-audited v2 weekly/monthly adapters currently omit explicit retry,
timeout, OpenAI storage and telemetry settings. No further live AI Review
provider benchmark, test issuance or activation is permitted through those
unhardened call sites. The implementation must apply the same endpoint,
`store: false`, telemetry-off, zero-hidden-retry and timeout controls to any v2
compatibility call that remains reachable before cutover, or make that call
unreachable before provider testing resumes.

No provider-library default is part of the contract. The versioned selection
adapter must explicitly use the OpenAI Responses API and official
`https://api.openai.com/v1` endpoint, not the provider callable's current
default API family. `OPENAI_BASE_URL`, a Vercel gateway variable or another
ambient endpoint override cannot redirect AI Review traffic. Tests may inject a
local fake transport only through a non-activatable test dependency boundary;
the activated adapter fails closed for any non-approved scheme, host, port or
path.

Each real selection call explicitly freezes and applies:

- non-streaming `generateText` with one structured-output model call and no
  tools, output-repair call, conversation or previous-response continuation;
- `maxRetries: 0`, because the installed AI SDK otherwise defaults to two
  retries that would be invisible inside one persisted attempt;
- a calibrated total timeout shorter than the persisted lease-recovery
  deadline;
- `providerOptions.openai.store: false`; the installed OpenAI provider otherwise
  defaults to storing the generation;
- AI SDK telemetry disabled for this call, with no callback, diagnostics-channel
  or integration allowed to retain prompt/output bodies;
- the exact output-token allowance and strict schema; and
- every other supported behavior-, privacy- or cost-affecting option as an
  explicit calibrated value or explicit `not_applicable`, including reasoning
  effort and service tier where the pinned model supports them.

A one-shot audited fetch boundary validates the final outbound request before
network I/O. It permits one POST to the frozen Responses path, validates an
exact JSON field allowlist and the expected canonical instruction/package/
schema identities, requires `store: false`, rejects tools/continuations/unknown
fields, forces redirect handling to `error`, and records only a canonical
request-manifest digest plus bounded metadata. Authorization remains secret and
raw request/response bodies never enter logs. A second fetch invocation for the
same dispatch is rejected even if a future SDK version reintroduces internal
retry or repair behavior.

The snapshot records the actual adapter and exact installed `ai`/
`@ai-sdk/openai` versions used to produce that manifest. A dependency or adapter
upgrade must pass a captured-request compatibility fixture. If an old frozen
manifest cannot be reproduced exactly by the active versioned adapter, the
request uses `provider_configuration_drift` and its frozen deterministic default
rather than silently sending a changed request. Historical compressed codecs
and invocation-manifest decoders are append-only compatibility registries; they
cannot be removed while an unerased snapshot still depends on them.

### Provider dispatch leases and crash recovery

Every real provider attempt owns one persisted dispatch row. It records the
attempt and package digests, a monotonically increasing lease generation, the
then-current database-recovery epoch, an unguessable fencing token kept out of
the provider package, lease acquisition/expiry times, whether transport was
allowed to start (`transport_may_have_started_at_utc`), bounded provider-
response identity when available and usage-settlement state. The provider
transport hard deadline must expire before the lease-recovery deadline. The
singleton recovery-state row stores the current
cryptographically random epoch value and its transition time. Only a dispatch
whose epoch equals that singleton and whose generation/token own the current
lease can commit that transport boundary, accept a response or participate in
issuance. An expired, pre-restore or superseded worker is permanently fenced out
even if its response later completes.

The database and external transport cannot commit atomically. Therefore the
current worker first commits a `transport_may_have_started` transition under its
epoch/generation/token and only then invokes the provider. A crash after that
commit but before the network call is conservatively treated as unknown
exposure; the same attempt is never resent. Marking dispatch only after the
network call is prohibited because a crash between send and mark could hide a
real charge and authorize a duplicate call.

Recovery processes expired rows one at a time before ordinary retries:

- an expired lease that never crossed the committed transport boundary
  finalizes the attempt/reservation as failed with no usage exposure;
- an expired lease whose committed dispatch boundary says transport may have
  started becomes terminal for selection with `usage_unknown_after_dispatch`;
  it never creates a fabricated receipt;
- the reservation's maximum cost remains counted as unresolved paid-cycle
  exposure until an exact late receipt is recorded or an explicit provider-
  invoice reconciliation resolves it; actual and maximum exposure are never
  counted together; and
- an expired pre-boundary attempt may follow the normal bounded retry policy,
  but a request with `usage_unknown_after_dispatch` may issue only its frozen
  deterministic default after the attempt is selection-terminal; it cannot
  create another paid provider attempt.

Recovery never resends the same attempt, starts a second provider attempt after
unknown transport or assumes an external call did not happen. A crash after
provider success but before the local issuance transaction therefore cannot
silently lose cost protection or duplicate a call. If the original process
later receives exact usage, it may append the one real receipt
through a dedicated late-settlement path that requires the exact persisted
retired dispatch token plus a unique provider-response identity, revalidates the
frozen provider/model/rates and compares actual usage with the reservation
without mutating the terminal attempt/reservation. The retired token can settle
cost but can never regain selection/issuance authority. Actual usage is factual
evidence: if it exceeds a reserved token or cost maximum, the system still
records the exact receipt, marks `reservation_overrun`, uses actual cost in every
cap/aggregate and blocks further provider calls under the bounded control policy
until the overrun is handled. It never clips, rejects or rewrites usage to make
the reservation appear correct. The receipt replaces unresolved maximum
exposure, but the expired fence cannot select or issue. A crash inside the
SQLite issuance transaction rolls back the issued row, accepted audit and
notification together.

The same outcome classification applies without a crash. Any exception,
timeout, malformed structured output or provider refusal after the committed
transport boundary records an exact receipt when trustworthy usage is present.
If trustworthy usage is absent, it becomes `usage_unknown_after_dispatch`,
retains maximum exposure and prohibits another provider attempt. Only a failure
provably rejected by the local validator before the transport boundary has zero
usage exposure. HTTP/library error labels alone never prove that OpenAI did not
process a billable request.

Backup restore requires the prior runtime/scheduler to be stopped before the
restored database becomes authoritative. In one exclusive startup transaction,
the restored runtime replaces the singleton's persisted epoch with a new
cryptographically random value, then reconciles every copied nonterminal lease
before ordinary scheduler work. Every copied pre-restore lease is fenced even
when its wall-clock expiry has not arrived. The platform's single-writer/one-
authoritative-database rule remains mandatory; an epoch does not make concurrent
restored clones supported.

Account/workspace erasure wins over every lease: a late response must re-read
the scoped request and current fence, and if the rows were erased it is
discarded without recreating evidence, issuing a review or notifying the user.
Provider aggregate billing may still show that external call, but no erased
private payload or account-linked receipt is reintroduced locally.

### Attempt selection

Each provider attempt may append one private selection audit, and a final
deterministic-default issuance may append one accepted audit without pretending
that another provider call occurred. Each audit contains:

- request reference, nullable provider-attempt/dispatch references and the
  accepted recovery epoch/lease generation when a provider response was
  evaluated;
- selection source (`provider_selected` or `deterministic_default`);
- engine, shortlist and authorized-review-plan digests;
- structured provider selection JSON and digest when parseable;
- returned/resolved package and request-local choice keys, model context-
  envelope version and exact reservation/input-count result when a provider
  attempt occurred;
- selected `reviewPlanRef` and exact rendered-output digest when accepted;
- validation state and a bounded failure code;
- issued-review reference only for the accepted selection;
- recorded time.

The selection table also rejects updates and deletes. The accepted selection's
focus targets are the authority for later follow-through. The customer-facing
v3 JSON preserves the normal visible review fields, v2 JSON remains unchanged,
and the existing review page reads both through one customer view model.

When building a later periodic or monthly insight snapshot, the repository
loads accepted focus targets for each included issued review and joins them to
the visible `nextPeriodFocuses` by review and focus ordinal. Missing audit data
on a legacy issued review takes the documented lower-confidence compatibility
path; it is never mistaken for a tracked target.

For an accepted provider selection, the v3 issued review, valid selection audit,
receipt, attempt finalization and request finalization are written in one
transaction. An invalid selection can append a rejected selection audit and
finalize only that attempt as failed; it cannot create an issued review. A
deterministic default writes the v3 issued review, accepted selection audit and
request finalization atomically with no fabricated provider attempt or receipt;
any real failed attempts and their actual usage remain separately immutable.

Database uniqueness and conditional state transitions enforce one accepted
selection audit and one v3 issued row per request. Every issuance transaction
must first win an atomic pending-to-issued compare-and-set on the scoped request;
only that winner may insert the accepted audit, issued row and the one
`ai_review_ready` notification/source event. Repeating the same issuance call
returns the already-issued review. A losing provider success or fallback path
cannot replace the output, append a second accepted audit or notify twice.

A deterministic fallback is eligible only after every provider attempt is
terminal for selection, no reservation or transport owns the request's active
selection lease, and the request is still pending. Transport timeout separates
issuance authority from provider-cost settlement: an attempt can become
terminal for selection while its actual-usage settlement remains pending if
remote cancellation was not confirmed. A response arriving after the fallback
may append the real attempt receipt and bounded late-result settlement code,
but it can never validate a selection or issue/replace the review. Failed and
late real calls with receipts remain included in actual provider usage/cost
totals; unresolved calls whose committed dispatch boundary was crossed remain
separate conservative maximum-cost exposure. The deterministic issuance itself
contributes no provider receipt or cost.

### Retry and activation behavior

The runner reads the frozen insight snapshot by request ID and builds every
retry from the same input, candidate shortlist and digests. It never reruns the
engine against later Journal state. Reservation bytes and provider token counts
include the frozen shortlist and bounded plan catalog. Because every authorized
plan's complete visible output is frozen in the snapshot, a retry after a code
deployment cannot silently re-render old evidence with a newer template.

Before any provider attempt, the coordinator measures the full frozen envelope:
system instructions, strict selection schema, canonical package and the
512-token response allowance plus the existing protocol headroom. It uses the
pinned model's authoritative input count when required and the existing
conservative estimator/reservation otherwise. The package must fit both the
frozen and currently authoritative safe input/total-context boundaries for that
same model. It is never silently
truncated, summarized, split into independently selectable subpackages or
rebuilt with omitted required provider-projection fields. When an otherwise
activated and authorized request cannot fit or reserve that complete envelope,
the coordinator issues
the already-frozen deterministic default with `provider_input_limit` or
`provider_reservation_refused` provenance and makes no partial provider call.
The local engine has still calculated the review from the complete exact source.

Already-issued, failed and stopped v2 requests remain immutable and are never
retrofitted. The cutover gate above requires no pending v2 request, attempt or
reservation, so a pre-activation request never crosses activation and silently
changes generation path. Every request created after activation explicitly
stores `insight_selection_v3` and must have its atomic insight snapshot or
request creation fails.

The migration uses the next available Coach migration identity at
implementation time because concurrent platform work may claim an earlier
number. The migration manifest, initialization digest, administration counts
and backup/restore verification must include all six new tables. Account-
erasure ordering includes the four scoped tables but never deletes the database-
wide singletons. The same migration's request/attempt table rebuilds
must preserve every existing row and JSON byte, foreign key, unique identity,
index and immutable transition trigger; backfill counts/digests and
`PRAGMA foreign_key_check` must reconcile independently before activation.

## Provider selection contract

The provider returns one strict whole-review selection:

```text
contractVersion: traderlink_coach_ai_review_plan_selection_v1
packageKey: <the exact short providerPackageKey supplied in this package>
choiceKey: plan_1 | plan_2 | plan_3 | plan_4 | plan_5 | plan_6
```

The implementation uses an exact strict object schema that rejects unknown
keys; it cannot rely on a default object parser that strips an unexpected raw
prose field. `packageKey` must exactly equal the short frozen key in the current
package, and the request-local choice must map to one of that package's frozen
authorized complete plans. The server resolves it to the private
`reviewPlanRef`; the provider never has to reproduce a long digest. An unknown,
out-of-range or cross-request package/choice key fails the attempt. The provider
schema requires the unpadded 22-character base64url package-key shape as well as
the exact value match. The response is intentionally tiny, so the version-one
provider output reservation has a 512-token ceiling rather than retaining the
legacy free-prose output allowance. Actual usage remains receipt-tracked.

The new customer-facing v3 review continues to display the normal text and
focus list. Hidden plan, section, claim and focus metadata is stored privately
so future follow-through and support audits can identify exactly what was used.
Older v2 outputs remain readable without metadata.

The frozen section-plan catalog includes the allowed claims. Each
`claimRef` binds the exact selected finding, subject, measurements,
numerator/denominator, population coverage, trade/day examples, note
attributions, attribution kind and a server-rendered trader-facing fact clause.
The catalog also contains bounded server-owned `bridgeRef` clauses that can
connect or emphasize only compatible selected claims without adding a new fact.
The server assembled and froze every visible section before the provider call;
the provider never writes, edits, reorders or recombines visible prose. Two
unrelated measurements may both display `25%`, but their different semantic
claim references and clauses cannot be swapped.

Improvement and friction cannot reuse the same `findingRef`, but the same rule
or behavior subject may legitimately appear in both lanes through distinct
candidates. For example, a rule-break rate may improve materially while the
remaining breaks still account for the largest share of losses. Each section
must use its lane's own measurements and do a different explanatory job. A
contrast candidate may support the opening and one other section.

The engine freezes `allowedSectionSelections` before building review plans.
Each entry contains the default finding and any permitted alternative with its
server-owned reason. An alternative must be within ten lane points, no more
than five confidence points below the default and deterministically qualify as
`avoids_overlap`, `stronger_focus_connection` or
`stronger_evidence_specificity`. Subjective `stronger section coherence` is not
an override. Only globally valid combinations become a `reviewPlanRef`; the
provider cannot reach the section-level alternatives directly.

Every factual numerical, behavior, rule, ticker, date, result or representative-
example statement comes from a server-owned claim. Counts are rendered as
digits rather than unvalidated number words. Every bridge is authorized for the
exact section-plan claim set and can only state its bounded verdict or rank-
based importance. Semantic claim/bridge binding and the frozen whole-review
plan are the primary controls; a prose grounding scan remains a defense against
renderer defects.

A note-derived statement is also a server-owned attributed claim carrying its
exact `noteRef` and a bounded exact excerpt introduced by language such as `you
noted`. Notes may explain a selected example; they cannot become a measured
recurring pattern or causal explanation. The renderer cannot infer emotion,
hesitation, discipline, intent or another motive from a note. It may show only
the attributed excerpt or omit the note; provider paraphrases do not enter the
output contract.

Each section plan's `selectionState` is `selected` or `not_available`.
`not_available` requires one bounded engine reason: `no_qualifying_pattern`, `insufficient_coverage`,
`no_compatible_baseline`, `no_later_evidence` or `required_facts_unavailable`.
Each reason has a server-rendered clause. It is accepted only when its exact
gate state is true, and the plan builder cannot skip a populated lane. In
particular, insufficient evidence cannot be rewritten as `nothing held you
back`, and no compatible baseline cannot be rewritten as no improvement.

When more than one boundary is true, reason selection is deterministic:
`required_facts_unavailable`, then `no_compatible_baseline`, then
`no_later_evidence` for focus follow-through, then `insufficient_coverage`, and
finally `no_qualifying_pattern` only after the required facts and evidence gates
were sufficient to search for one. The audit retains every applicable boundary
even though the visible section uses one primary reason.

`selectionMode` is section-specific and engine-authorized. Normal lane choices
use `primary`. `What improved` may use `no_improvement_comparison` when a
compatible series is unchanged, mixed or worsening and no qualifying
improvement exists, or `maintained_strength` when no compatible earlier/later
baseline exists but a measured strength does. When the friction lane is empty,
`What held you back` may use `mixed_result` for an eligible contrast or
`no_friction_strength` for a measured strength; otherwise it is
`not_available` with the exact engine reason. The review-plan builder cannot
insert a fallback mode when a normal eligible candidate exists.

`sectionPurpose` is also bounded. The opening uses `period_outcome` or
`result_process_contrast`; improvement uses `directional_change`,
`no_improvement_comparison` or `maintained_strength`; held-back uses
`residual_friction`, `mixed_result` or `no_friction_strength`; follow-through
uses `focus_change` or `focus_measurement`. When improvement and friction share
a subject, they must use `directional_change` and `residual_friction`, cite
different primary measurement references and explain change versus remaining
impact. This is how the validator permits a useful shared subject without
accepting duplicated sections.

The opening additionally freezes one `openingEmphasis`: `measured_strength`,
`result_process_contrast`, `result_concentration` or `outcome_only`. It chooses
the highest-confidence eligible nonduplicative emphasis in that order only when
the selected claim passes its own lane gate; otherwise it falls through to the
next eligible form. `Outcome_only` is a complete truthful opening and cannot be
replaced with a recordkeeping compliment. The outcome sentence always precedes
the emphasis sentence, so the review does not make the trader search later
paragraphs to learn the month's actual result.

Selections also have minimum useful content, enforced through referenced
measurements rather than wording alone:

- the opening states the exact period outcome when available, otherwise its
  bounded coverage state, and identifies one main takeaway or strength;
- `What improved` cites early and later measurements plus their delta, or the
  exact unchanged/mixed/worsening weekly series; when no comparison exists, it
  uses a measured maintained strength rather than generic no-improvement
  wording;
- `What held you back` cites the affected count and denominator, the financial
  or Analyzer path impact when available, and a representative trade/day when
  the candidate has an eligible example;
- focus follow-through names the issued focus, its later evidence span and one
  exact bounded engine verdict, including a non-directional measured verdict
  for an examination focus;
- every required strength cites its count/rate or its exact representative
  evidence.

These requirements make the sections useful without turning the review into a
stat dump; prose remains concise and trader-facing.

The engine also supplies one to three bounded next-period focus targets derived
from selected measurable findings. Each complete review plan owns the
`focusTargetRef` and compatible server-owned `focusQuestionRef`; the provider
cannot choose or author visible focus prose, a hidden target, metric, direction
or eligibility date. Focus targets must be distinct, measurable and traceable
to their source finding. When only one or two distinct targets qualify, the
review returns fewer than three rather than padding the list. Generic advice or
rewordings of the same subject fail validation.

Focus ordering is deterministic and tied to the review's conclusions. The first
question targets the selected residual held-back action target when it has an
observable next-period opportunity and is not merely a result-only outlier. If
that target is unavailable, an unresolved measurable earlier focus comes first.
The next slot may track whether the selected improvement is sustained; the last
may repeat a selected strength under the same evidence definition. Every
question names the exact observable situation and what the later review will
count or compare. A question such as `review your exits` or `compare the trade
with your plan` is invalid even when it mentions the right broad subject.

`futureTrackability` is frozen with the immutable source snapshot. A focus tied
to a rule that is then
paused, retired or outside its effective interval is not emitted as though the
trader will have a normal opportunity to follow it. The historical finding may
remain in `What held you back`; a future question requires either the same rule
currently active or a separately valid observable behavior target. The engine
never recommends reactivating a rule.

An exact prior `focusTargetRef` cannot be emitted again. An unresolved subject
may be carried forward only through a new current finding with a changed later-
evidence measurement or a more specific measurable boundary; the selection
audit records the carried-forward relationship. Cosmetic rewording never
creates a new target.

Each target supplies one canonical version-one server-rendered retrospective
question bound to its exact subject and metric. An unknown or incompatible
`focusQuestionRef` rejects the attempt, so another behavior, entity, amount or
threshold cannot be introduced through free text. Later wording variants
require a new question-rendering version rather than multiplying plan choices.

## Server validation

Before persistence, validate that:

- the provider response has exactly the selection contract version, current
  `providerPackageKey` and one request-local authorized `providerChoiceKey`,
  with no unknown or raw-prose field, and the frozen mapping resolves it to one
  private `reviewPlanRef`;
- the request, period, source-snapshot digest, canonical provider-package digest
  and selection-schema version all match that mapping, preventing cross-request
  replay;
- request, attempt, dispatch and selected output all carry the same immutable
  `insight_selection_v3` generation contract; a v2 attempt/output or missing
  contract cannot enter this path;
- the provider projection passed its exact recursive field allowlist and
  forbidden private/internal-field scan before freezing, with no raw source,
  identity, attachment, secret, Data Decision or cross-account value;
- every compressed snapshot artifact reproduces its recorded canonical
  uncompressed length and digest before it is parsed or sent;
- a provider-selected path used the frozen provider/model/instruction/schema
  envelope and exact invocation-manifest version/digest, passed the one-shot
  outbound host/path/body audit, and used the dispatch's current recovery epoch,
  unexpired lease generation and matching fencing token;
- the actual call was one non-streaming Responses request with `maxRetries: 0`,
  bounded timeout, `store: false`, telemetry disabled, no tools/repair/
  continuation and no second fetch invocation;
- the selected complete plan, ordered section plans, focus questions, rendered
  output and digests exactly match the immutable snapshot;
- every selected finding and focus reference exists;
- every population uses its declared observation unit, contains unique sorted
  members, keeps numerator members inside denominator members and reconciles
  day/event/trade counts to the exact contributing source references;
- every behavioral rate uses its frozen family opportunity denominator and
  keeps conditional opportunity rate distinct from full-period prevalence;
- every rule opportunity falls inside the exact version's effective active
  interval; paused/retired/outside-period rows do not become not-reviewed, and
  only same-version preset violation events authorize execution-specific prose;
- each applicable rule target has exactly one normalized followed/broken/
  explicit-not-reviewed/expected-missing state; evaluator `n/a`, inactive,
  structurally not-applicable and evaluation-unavailable states cannot be
  relabelled or silently enter a reviewed-rate denominator;
- custom day/trade/both opportunities reproduce the exact historical Trade
  Tracker projection; a missing result row cannot create a custom-rule target
  and day/trade scopes never pool;
- reviewed rate, review completion, recorded-disposition coverage and broken
  prevalence reproduce their distinct frozen member sets;
- preset evaluated-followed/broken/not-applicable/unavailable states remain
  orthogonal to stored review disposition, use their own rate/coverage sets and
  cannot raise review completion or duplicate one rule/target finding;
- every projected preset event is claim-selected, prompt-safe and limited to its
  event kind/trade reference/timestamp/authorized values; status-only or
  unrelated events never enter the package;
- every result/event/note/focus member uses its declared temporal owner; an
  outside-period execution event or Swing note is not counted merely because
  the linked trade closed inside the period;
- every declared-style process claim uses one current known homogeneous trade
  style, while every Daily Trade Analyzer claim uses current ready evidence,
  objective same-market-date timing and no contradictory Swing/other style;
- `not_available` appears only with the exact engine-confirmed reason and its
  matching coverage, baseline or later-evidence state;
- every selection is eligible for its visible lane or the exact engine-
  authorized fallback mode;
- default-selection, per-section distance, whole-plan 12-point loss and exact
  compensating-benefit rules are respected;
- cited trades belong to the selected finding;
- cited notes belong to the selected finding/evidence record and note-derived
  prose is explicitly attributed to the trader;
- every included Swing note has an in-coverage review date and exact identity-
  linked included closed trade; open/out-of-period notes are absent;
- every section `claimRef` is an authorized semantic claim for the selected
  finding and its server-rendered fact clause is assembled without provider
  modification;
- every rendered count, percentage and money value exists in that exact claim's
  measurements, matches its server-generated display literal and keeps the
  affected-versus-money-eligible coverage clause;
- every visible rate retains its integer numerator and denominator, with small-
  denominator templates leading on counts rather than an isolated percentage;
- identical display literals belonging to different metrics, subjects or
  denominators cannot satisfy one another's claim reference;
- every selected `bridgeRef` is authorized for that exact section claim set and
  its position matches the frozen section plan;
- every financial claim uses the measurement's period-result, cohort-
  association or Analyzer-path attribution kind and does not convert
  association/giveback into invented causal or guaranteed-profit language;
- every behavioral financial score uses adverse/beneficial cohort net
  contribution rather than cherry-picking only losing or winning members, and
  every partial-money measurement remains display-only unless its complete
  numerator and comparable denominator coverage gate passes;
- every financial score reproduces the polarity/path-pool share, period-
  magnitude share, harmonic scale guard and applicable descriptive consequence
  factor; a tiny polarity pool or non-worse comparison cannot manufacture the
  main financial drag;
- every behavioral consequence verdict passes fixed structural-stratum
  standardization, rate/median conflict handling and the exposure-scale boundary;
  mixed/confounded/opposite results receive no full money rank and no risk-
  normalized wording;
- a day-rule money score or after-violation claim uses only the exact typed
  affected-execution members; full-day P/L remains outcome context and a
  status-only/evaluator-unbounded day rule receives no financial-consequence
  rank;
- optional Analyzer/rule evidence reproduces its fixed-stratum coverage-balance
  state, and materially skewed or balance-unavailable evidence cannot use
  period-wide or financial-headline language;
- improvement has a valid earlier/later comparison, while an authorized
  no-improvement fallback has the exact series or maintained-strength evidence
  required by its mode;
- improvement also passes the declared composition-shift/standardized-rate
  sensitivity or is explicitly mixed/unavailable;
- improvement reproduces its latest-sufficient-bucket state and uses
  `improved_then_recently_regressed` when the fixed reversal gate passes;
- a latest-state reversal has both its observation minimum and two independent
  market dates/days; one high-volume date remains a recent outlier only;
- follow-through uses later evidence after the source focus and a current or
  explicitly revised canonical baseline rather than superseded source facts;
- a recurring claim passes the recurrence gate;
- a visible recurring/trend/contrast selection passes the 50-confidence and
  actionability floor, while examples/outliers retain their narrow labels;
- section purposes are valid, and sections cannot repeat the same
  `factualJobKey`, `coverageJobKey` or rendered-clause digest; same-subject
  improvement/friction uses different purposes and primary measurements;
- the global plan satisfies the strength, overlap, nonduplication and section-
  job constraints, evidence/action-target diversity caps and same-cluster
  exception thresholds rather than only validating each section in isolation;
- every provider-selectable plan preserves the deterministic decision-critical
  spine, and the opening keeps outcome first plus exactly one eligible emphasis;
- every selected lane reproduces its rank margin and leave-one-bucket stability;
  only a dominant winner can receive `main`/`clearest` wording;
- hidden focus-tracking targets refer to measurable engine families;
- a rule/process strength identifies one exact followed rule or proves complete
  followed coverage for its declared applicable rule set; missing/not-reviewed
  rules cannot satisfy a clean-process claim;
- every next-period focus uses an engine-authorized distinct `focusTargetRef`
  linked to its source finding and is not a cosmetic duplicate of an earlier
  target;
- the first next-period focus targets the selected actionable residual friction
  unless the exact documented unavailable/result-only exception applies, and
  every focus declares its observable opportunity and later metric;
- follow-through never reuses the same later members from an earlier assessment,
  applies the unassessed-focus preference/repeat exception and records the prior
  assessment boundary;
- rule-bound future focuses pass snapshot-time `futureTrackability`; paused,
  retired or ineffective rules cannot create an implied reactivation target;
- every `focusQuestionRef` is authorized for its exact target and supplies the
  complete visible next-focus question;
- the review-wide coverage limitation is attached exactly once through
  `incompleteRecord`, while measurement-local subset denominators remain in
  their owning fact clauses;
- every selected claim/bridge combination exists in the activated renderer
  coverage registry, including its grammar, currency, attribution,
  availability and partial-coverage variant;
- the review contains a strength when the brief contains a required strength;
- mixed/comparison sections with available two-sided evidence use the required
  supporting and contradicting/remainder representative roles rather than two
  favorable same-side examples;
- an affected representative note triggers the context-qualified objective
  clause/exact-safe-excerpt boundary and cannot be converted into motive or an
  automatic bad-decision label;
- the opening labels money as closed-trade result, and every confirmed period-
  end open position contributes its exact count—but no identity or invented
  unrealized value—to the single `incompleteRecord` boundary;
- open-at-period-end lifecycles with accepted in-period reductions are counted
  separately, remain outside closed-trade P/L and financial rank, and cannot be
  represented as exposure or realized/unrealized money;
- every visible field fits its cadence-specific character and sentence budget;
- the final v3 output passes deterministic semantic and existing output-safety
  checks;
- generation source, provider/model nullability and receipt presence match the
  actual issuance path; and
- account scope, entitlement, both account/platform feature controls and the
  request's pending issuance transition still authorize this
  result, so erasure, revocation, a late provider result or competing fallback
  cannot create a second accepted selection, issued row or ready notification.

A failed selection uses the existing immutable retry boundary. The engine does
not rebuild findings from later-edited Journal data during a retry.

## True-month acceptance fixture

### Calendar and issuance sequence

Use the August 2026 U.S.-equities calendar and 420 synthetic completed trades:

- August 3-7: 100 trades and an issued weekly review;
- August 10-14: 100 trades and an issued weekly review with Week 1 context;
- August 17-21: 100 trades and an issued weekly review with Week 2 context;
- August 24-28: 100 trades and an issued weekly review with Week 3 context;
- August 31: 20 exact-month trades not represented by those four weekly
  reviews;
- August 1-31: one monthly request containing all four actually issued weekly
  reviews, all weekly focus metadata, all 420 exact-month trades and the
  uncovered August 31 reflection/Analyzer context.

The test must use the real request, coordinator, provider-control, generation,
receipt, immutable issuance and saved-review reopen flow in a synthetic-only
database. A benchmark-adapter-only call is not acceptance.

### Planted pattern matrix

The fixture must contain independent and overlapping patterns with known
expected rank behavior:

1. A repeated high-financial-impact rule problem that improves materially from
   the first two calendar-week buckets to the final two, with the middle bucket
   supporting the direction.
2. Green-to-red ended-red trades with measurable combined peak-to-final
   reversal, concentrated early but not eliminated later.
3. A separate harmful add-after-peak cohort with lower financial impact but
   strong repetition.
4. A one-off very large loser that must rank as a material outlier without
   being called recurring behavior.
5. Clean profitable trades with followed entry/risk/exit rules across the
   month, including the final partial week.
6. Rule-followed losing trades that demonstrate good process without positive
   outcomes.
7. Profitable trades with broken rules that demonstrate outcome/process
   conflict.
8. A partial/final-exit behavior that improves later in the month.
9. A re-entry or cooldown behavior that worsens in Week 4.
10. A weak ticker/tag cohort whose apparent result disappears after removing
    one outlier and therefore must be penalized.
11. One strong individual entry example that is eligible as an example but not
    a month-wide pattern.
12. Incomplete Analyzer coverage for a minority of trades to test exact
    denominators and confidence adjustments.
13. Distinct daily and trade reflections based on the planted facts; no
    repeated boilerplate strength or weakness text.
14. A false rate improvement created only by much higher later rule-review
    coverage; it must become mixed/unavailable rather than rank as improvement.
15. Two broken rules on the same losing trades; each association remains
    visible, but their losses must never be added or described as independently
    caused by both rules.
16. A broken-rule cohort with large gross losing-trade P/L but larger winners,
    proving it is process friction/contrast with zero adverse net contribution
    rather than the month's top financial drag.
17. A smaller known-money subset whose covered members look extreme while
    affected members or the period denominator have missing P/L, proving its
    money is display-only and cannot win financial rank.
18. An apparent early/later rate improvement that reverses after fixed
    structural-stratum standardization because the later trade mix changed.
19. Multiple event rows on the same trades/days, proving the family-declared
    observation unit prevents event count from inflating trade/day recurrence.
20. Three high-ranked labels on nearly identical evidence plus a slightly lower
    independent problem, proving diversified alternatives retain the distinct
    useful issue.
21. Five green-to-red failures among 100 covered trades when only six ever moved
    green, proving 5% period prevalence cannot replace the 5-of-6 opportunity
    rate or vice versa.
22. More than 60% Analyzer coverage that is concentrated in winners and early
    weeks, plus rule reviews concentrated after losses, proving aggregate
    coverage alone cannot authorize period-wide claims.
23. A highly profitable month with one trivial loss representing 100% of the
    losing-trade pool, proving the raw loss share cannot receive dominant
    financial rank after the period-magnitude scale guard.
24. A broken-rule cohort with material losses whose followed-rule comparison is
    equally or more adverse, proving cohort money can remain visible without
    being ranked or described as a worse associated outcome.
25. A strong early-to-later improvement followed by one sufficiently populated
    latest-week reversal that erases most of the gain, plus a separate sparse
    partial-week wobble that must not reverse the verdict.
26. A mixed candidate with clear supporting and contradicting trades, proving
    representative evidence and provider excerpts show both sides.
27. Four weekly reviews whose visible prose is replaced with stale, generic and
    instruction-shaped text while the exact current month remains unchanged,
    proving the decision-critical spine cannot move.
28. One rule activated, paused, resumed and later retired inside the month, with
    recorded rows on every interval, proving only active same-version
    opportunities enter rates and a retired rule cannot create a future focus.
29. A threshold rule whose trigger trade follows the rule and whose next trade
    is the exact evaluator violation, plus a status-only custom rule, proving the
    engine never labels the trigger or a specific custom-rule execution as the
    known violation; the custom target may still be described as marked broken.
30. Profitable trades with one followed rule and several not-reviewed applicable
    rules, beside losses with a complete followed entry/risk/exit set, proving
    absence of recorded breaks cannot win the clean-process strength.
31. A broken-versus-followed result difference caused by fixed style/direction/
    week mix, plus a separate rate-versus-median direction conflict, proving the
    consequence verdict becomes composition-confounded or mixed.
32. A dollar-median difference where one cohort's median absolute P/L is more
    than twice the other's and no size/risk fact exists, proving dollar scale
    cannot masquerade as normalized execution quality.
33. Twenty adverse trades on one final partial-week market date after a genuine
    monthly improvement, proving volume alone cannot satisfy the two-date latest-
    reversal gate.
34. A broken-rule representative trade with a trader note describing special
    circumstances, proving the review preserves the exact context without
    changing status, inferring motive or calling the decision automatically bad.
35. Three measurable issued focuses: an old one already assessed from unchanged
    evidence, a newer unassessed focus within 10 points and a materially worsened
    old focus with new evidence, proving assessment novelty and repeat exceptions.
36. Several factually confirmed positions open at month end with no accepted
    unrealized P/L, proving the opening remains closed-trade-only and the single
    coverage sentence discloses their count without valuing or identifying them.
37. One active applicable rule with followed, broken, explicit-not-reviewed and
    absent result rows, plus preset `n/a` cases for both a proven non-applicable
    target and missing evaluator facts, and a custom `both` rule projected onto
    exact historical day/trade targets. Separate preset targets have no saved
    disposition but exact evaluated-followed/broken evidence, proving every
    review state, evaluator state, scope and denominator remains distinct.
38. A late-day preset violation after several earlier profitable and losing
    trades, with an exact evaluator affected-execution set, beside an identical
    status-only day rule without that set, proving full-day P/L is context and
    only bounded post-violation members can receive financial association.
39. A still-open lifecycle with one in-period position reduction and another
    with no reduction, both closed only after the immutable month snapshot,
    proving neither lifecycle enters August closed-trade P/L and later closure
    cannot rewrite the issued boundary.
40. Two top friction findings within four post-penalty points whose order flips
    under one leave-week-out check, plus a separate decisive winner, proving
    deterministic selection does not overstate rank certainty.
41. One upstream-eligible period with zero closed trades and one sparse period
    with two trades, proving unavailable result metrics remain unavailable and
    sparse evidence cannot become a recurring process conclusion.

The precise values are fixed before generation. The expected engine ranks are
asserted before any provider call.

### Expected engine behavior

- The planted major repeated problem ranks in the top three friction findings.
- The planted improvement ranks first or second in the improvement lane.
- The large one-off loser does not outrank the recurring major problem solely
  because of its size.
- The weak outlier-dependent ticker/tag pattern is visibly penalized.
- At least one clean execution or process strength reaches the provider brief.
- The Week 1 focus has measurable Weeks 2-5 follow-through, including the final
  partial calendar-week bucket.
- The coverage-shift trap does not enter the improvement lane as a clean win.
- The two overlapping rule candidates never produce a combined-loss claim.
- The net-profitable broken-rule cohort receives no adverse-money rank even
  though its losing members and process break remain visible.
- The partial-money trap cannot contribute a financial score.
- The mix-shift trap becomes mixed rather than clean improvement.
- Repeated events on the same trade/day do not inflate the primary recurrence
  count or sample-confidence component.
- At least one independent action/evidence cluster survives beside the default
  when it is within the documented score/confidence exception limits.
- Conditional management rates use their planted opportunity populations while
  full-period prevalence remains separately available.
- Selectively covered Analyzer/rule evidence is subset-labelled and cannot
  supply a period-wide or financial-headline conclusion.
- The tiny 100%-of-losses candidate receives only its scale-guarded money rank.
- The non-separated broken-rule cohort remains process/contrast evidence and
  receives no full financial-consequence rank.
- Paused/retired/outside-effective rule intervals do not change reviewed or not-
  reviewed denominators, and only the planted violation event can support the
  threshold execution claim.
- Sparse `no break recorded` trades do not become process strengths; the
  complete followed rule set does.
- Structurally confounded, rate/median-conflicting and exposure-scale-unavailable
  comparisons receive their exact mixed/unavailable consequence states and no
  full financial emphasis.
- The sufficiently populated late reversal renders as improved-then-regressed;
  the sparse partial bucket is preliminary only.
- The one-date 20-trade partial bucket remains a recent outlier and cannot flip
  the trend verdict.
- The mixed candidate's visible plan and projected excerpts include both a
  supporting and contradicting/remainder example.
- Every authorized complete review plan satisfies the four distinct section
  jobs, required-strength and cross-section overlap gates before provider input.
- The default and every alternative fit the renderer/output budgets, and no
  more than six complete plans enter the provider package.
- Every retained alternative stays within the whole-plan lane-loss limit and
  proves its exact overlap, focus-connection or specificity benefit; a merely
  different weaker plan is excluded.
- Every retained alternative preserves the same decision-critical spine, and
  changing only the four weekly prose bodies cannot change it.
- The opening reports activity and period result first, then at most one
  eligible nonduplicative emphasis; its first focus question targets the
  selected actionable held-back finding when one exists.
- The context-qualified rule clause retains the safe attributed note without
  inferring an exception, motive or discipline failure.
- Follow-through ignores unchanged reused evidence, prefers the unassessed focus
  inside the exact range and permits the worsened repeat only through its new
  evidence/material-verdict exception.
- Open positions contribute only the exact period-end count and closed-trade/
  unrealized boundary, never a guessed mark-to-market result.
- Open lifecycles with in-period reductions remain excluded from closed-trade
  P/L, disclose only their exact count and never create a partial-result or
  exposure rank.
- Missing rule rows, explicit not-reviewed rows and evaluator `n/a` states do
  not collapse together; every reviewed rate and coverage measure reproduces
  its declared denominator.
- Evaluator-only preset findings retain their own attributed rate and coverage,
  do not raise review completion and merge with any same-rule/target recorded
  finding rather than appearing as independent evidence.
- Custom day/trade/both opportunities match the planted historical Tracker
  projection, never arise from an absent review row and remain separate by
  target unit.
- Full-day rule P/L cannot rank as loss after a late violation. Only the planted
  typed affected-execution set can support the bounded money association.
- The near-tied/sensitivity-unstable winner starts directly with its exact facts
  and no ranking superlative, while only the planted stable five-point-separated
  winner may use one.
- Zero-closed-trade and two-trade periods retain truthful unavailable/sparse
  output and do not manufacture a recurring strength or friction finding.
- The month contains four issued weekly narrative contexts, not zero and not
  synthetic summaries created only inside the monthly fixture.
- Every eligible exact-month Analyzer record is present once in the private
  calculation source. The canonical provider data contains every required
  calculated Analyzer measurement/coverage series and only the authorized
  representative excerpts, alongside all permitted non-Analyzer provider
  fields, all four weekly reviews and August 31 facts exactly once.

### Realistic usefulness fixture

The 420-trade month is a scale and known-ranking stress test, not the only
product acceptance case. A second synthetic true-month fixture uses July 2026:
16 trades on July 6-10, 21 on July 13-17, 18 on July 20-24 and 25 on July 27-31,
with four actually issued weekly reviews and one ordinary July 1-31 monthly
review. July 1-2 contain no trades. It has varied short notes with some blanks,
a mix of preset and custom rules, known Day trades, known Swing trades, several
unclassified historical trades, linked dated Swing notes, ordinary missing/not-
reviewed outcomes, incomplete-but-usable day-trade-only Analyzer coverage,
several modest winners and losers, and no repeated boilerplate or 700-character
note on every trade. At least one Swing opens before July and closes inside it;
its result belongs to July, while its June entry event does not become a July
entry observation.

Its planted findings are intentionally less dominant: one financially material
repeated problem, one later-month improvement that remains a residual problem,
one credible maintained strength, one result/process contrast and one issued
Week 1 focus with Weeks 2-4 evidence. Expected ranks are asserted before the
provider call. The four weekly reviews, complete exact-month local calculation
source and bounded provider projection must enter the monthly flow through
ordinary persistence. This fixture
fails unless the saved monthly review gives a trader direct, measurable and
non-repetitive takeaways even when no single pattern overwhelms the month. It
also fails if a Day/Swing comparison is inferred, a Swing receives Daily Trade
Analyzer interpretation, a dated Swing note is joined by ticker/date instead of
identity, or an unclassified trade disappears from the result headline.

### Provider quality and stability

After deterministic acceptance:

1. Generate the four weekly reviews sequentially.
2. Generate and persist the monthly review once through the ordinary flow.
3. Reopen and inspect the saved monthly review.
4. Replay the exact monthly provider package at least twice without persistence
   to test selection stability.
5. Require the same decision-critical spine across all authorized review plans;
   provider replays may vary only the explicitly permitted supporting context.
   Representative examples cannot vary inside one frozen `reviewPlanRef`.
6. In a separate persisted run, exhaust provider selection attempts and require
   the byte-identical frozen default v3 output to issue with deterministic
   provenance and no fabricated provider receipt.
7. Reopen one legacy v2, one provider-selected v3 and one deterministic-default
   v3 review through the normal customer path.
8. Race a delayed valid provider response against the fallback boundary and
   prove exactly one path issues/notifies, the losing path cannot replace the
   review, and any real late usage is still settled to its failed attempt.
9. Run canonical packages just below and above the configured provider context
   envelope. Neither frozen provider projection may be truncated or split; the
   over-limit request must issue the same deterministic default calculated from
   the complete local source without a provider call.

The review fails even when its rendered prose reads smoothly if its plan uses a
materially weaker candidate, omits an available strength, repeats one issue
across all sections or cannot connect follow-through to a real earlier focus.

### Calibration and sealed holdout boundary

Small single-purpose calculation fixtures and the 420-trade planted month may
calibrate version-one thresholds and weights. The realistic 80-trade month and
a counterexample suite covering denominator drift, overlap, sparse periods and
mixed evidence are sealed holdouts: their expected qualitative ordering is
recorded before implementation output is inspected and they are not used to
tune the same engine version after a failure. A failed holdout requires either
a general defect correction plus a new engine version/resealed holdout, or an
honest documented limitation; no fixture-specific exception is allowed.

Provider selection and server-rendered review acceptance occur only after
deterministic calibration and holdouts pass. Later weight/threshold changes
create a new engine version and rerun all calculation fixtures, holdouts and
stability checks.

## Broader verification matrix

In addition to the 420-trade acceptance fixture, cover:

- low-activity month with fewer than ten trades;
- profitable month with poor process evidence;
- losing month with improving process evidence;
- negative month with rule-followed losses;
- positive month dominated by one winner;
- month with no reviewed rules;
- month with no ready Analyzer records;
- month with Analyzer records but no notes;
- month with complete notes and few trades;
- Monthly-only cadence with zero weekly reviews;
- two-week cadence;
- five-week month;
- cross-month weekly narrative context;
- partial first month;
- rule definition changed mid-month;
- custom rules only;
- mixed or unavailable currency;
- incomplete P/L where six affected trades include only four money-eligible
  trades;
- a broken-rule cohort whose losing members represent 25% of period losses but
  whose complete cohort is net profitable, beside a net-losing repeated cohort;
- a selectively covered cohort whose only money-eligible member is the largest
  loss, proving partial covered-subset money cannot affect financial rank;
- overlapping rule cohorts;
- overlapping prior/current request periods whose shared trades would otherwise
  appear on both sides of an improvement;
- one-trade outlier;
- contradictory notes, rule outcomes and Analyzer evidence;
- no eligible improvement;
- no measurable earlier focus;
- prior focus with clear improvement, mixed evidence and worsening evidence;
- first weekly review with no prior measurement baseline;
- later weekly review using a compatible frozen prior insight snapshot;
- engine-version change that makes a prior comparison incompatible;
- a monthly package whose four historical weekly prose blocks contain stale
  numbers, boilerplate and prompt-like instructions while their exact source
  facts and hidden focus metadata remain unchanged;
- user-authored note, custom rule title and tag text containing provider prompt
  injection attempts;
- nested unknown provider-projection keys and planted raw statement, broker-
  account, private UUID, identity, Data Decision, attachment/location and
  cross-account fields, each rejected before package freezing;
- a harmless UUID-shaped note value that matches no known private identifier,
  which remains valid, beside an exact private identifier copied into an
  allowed text field, which is rejected;
- captured application logs, normalized provider exceptions, Admin summaries
  and support audit output containing no note, package, prior-review or rendered-
  review text;
- custom rule/tag labels that would be ungrammatical or directive-like if
  inserted as verbs, proving templates render them only as quoted noun labels;
- unchanged structured facts with materially different note wording;
- early/later rate movement caused only by not-reviewed/Analyzer coverage
  changes;
- a raw early/later improvement caused by a material fixed-stratum population
  shift, including a planted Simpson reversal and a same-direction magnitude
  distortion above/below the 50% sensitivity boundary;
- a prior tracked-focus baseline whose round-trip, rule, Analyzer or trade-style
  source is later corrected, excluded or relinked, with both reconstructable
  revised-baseline and non-reconstructable cases;
- delayed review issuance after some nominal later-period trades already
  occurred;
- a sparse final partial week;
- a U.S. market holiday/early-close period and both Eastern DST transitions;
- the same subject as both improving trend and material residual friction;
- individually valid section plans that become repetitive, contradictory or
  omit the required strength when combined;
- a provider selection of an unknown complete plan whose underlying finding
  existed in the shortlist but was never authorized in a review plan;
- a provider result containing raw section prose or any extra object key, plus
  an internally malformed section plan with a cross-claim `bridgeRef`;
- two authorized measurements with the same display literal, such as a 25% win
  rate and a 25% loss share, to prove semantic claim binding;
- overlapping high-impact rule and Analyzer candidates whose P/L evidence sets
  are identical;
- three same-evidence/same-action candidates ahead of a distinct candidate
  inside and outside the 10-score/five-confidence diversity exception;
- one trade with three adds, one day with three reviewed rules and repeated
  execution rows, proving unique primary-observation membership and numerator-
  subset invariants;
- a five-member cohort inside a 420-trade comparator, proving confidence uses
  the weakest required population rather than the large remainder;
- leave-one-trade and leave-one-independent-bucket sensitivity that preserves,
  eliminates and reverses the signed candidate effect;
- a mixed known-Day/known-Swing/other/unclassified month with a Swing opened
  before the month, dated Swing notes, an intentionally planted Daily Trade
  Analyzer row on a Swing and a style plan requiring relink;
- legacy unversioned RSI values beside corrected calculation-version values,
  proving old RSI is unavailable to ranking, exact eligible coverage is shown,
  a repeated four-bucket RSI cohort can qualify and an isolated extreme reading
  cannot;
- an in-period Swing note on an included closed Swing beside an outside-period
  note and a note on a still-open Swing, proving only the first enters the
  calculation/provider source;
- the same completed trade with a prior-period entry and current-period exit,
  proving result ownership, event ownership and note dates remain distinct;
- each distinct `not_available` reason to prove that missing coverage, missing
  baseline and no qualifying pattern produce different truthful clauses;
- a Journal writer changing a note, rule result and Analyzer revision between
  attempted source reads to prove one request is wholly before or wholly after
  the write, never a hybrid;
- prompt-safe HMAC key rotation with unchanged semantic facts to prove that
  ranks and selections do not move;
- HMAC rotation after a request is frozen, proving package validation uses the
  stored literal, plus a mocked 128-bit package-key collision that must fail
  request creation;
- periodic and monthly renderer boundaries with zero/negative-zero money,
  singular/plural counts, unavailable currency, 81-plus-grapheme custom labels,
  combining marks/astral symbols, multiline/control-character text and
  safe/unsafe long notes;
- six eligible complete plans plus a seventh otherwise-valid plan to prove the
  hard bound and deterministic ordering;
- alternatives that pass section-level gates but exceed the whole-review
  12-point loss boundary or provide no threshold-level compensating benefit;
- exactly one eligible complete plan, which must issue without a provider call
  and record `single_authorized_plan` provenance;
- a case where the only globally valid combination would fall below a
  twelve-partial-plan beam, proving that all at-most-81 bounded combinations are
  checked before the best six are retained;
- a legacy issued v2 review beside provider-selected and deterministic-default
  v3 reviews on the same account, all reopened through the normal customer path;
- a cutover database containing issued, failed and stopped v2 requests plus zero
  pending requests/attempts/reservations, proving the request/attempt rebuild
  preserves every byte/count/digest and backfills only
  `generation_contract_version`;
- a missing/duplicate generation-contract singleton, a backward v3-to-v2
  transition and feature-control enablement before the verified v3 transition,
  each failing closed without request creation;
- a planted pending v2 request/attempt/reservation or billable attempt without
  reconciled receipt/no-usage evidence at the cutover gate, each blocking
  activation rather than being silently upgraded;
- an old-writer request/attempt insert that omits the required no-default
  generation contract, a v2 attempt against a v3 request and each crossed v2/v3
  output insertion, all rejected before a provider call or issuance;
- an existing v2 account/period identity requested after activation, proving it
  is returned unchanged without a v3 snapshot, second request or history
  upgrade;
- a first v3 monthly review containing two actually issued v2 and two actually
  issued v3 weekly reviews, proving all four enter monthly context while v2
  weeks do not fabricate hidden focus metadata;
- a post-v3 attempt to start a v2-only binary or restore the pre-v3 backup,
  proving the documented compatibility floor blocks destructive rollback;
- an activated provider's local per-request reservation rejected before a call,
  a receipt-bearing invalid structured selection and a post-boundary failure
  with unknown usage, each reaching the exact frozen default while preserving
  its distinct exact-or-maximum exposure and never fabricating a receipt or
  making a second provider call;
- the exact complete provider envelope immediately below and above its model-
  specific safe context boundary, proving no required projected field is
  truncated, summarized or split into a second selection call;
- a large Analyzer-covered month, proving unselected raw one-minute/five-minute
  observations never enter provider bytes while every aggregate and selected
  representative excerpt matches the complete private calculation source;
- a delayed provider success racing deterministic fallback, repeated fallback
  invocation and notification retry, proving one issued row, one accepted
  audit, one ready notification and exact late usage settlement;
- another request's valid package-key/`plan_1` response, the current package key
  paired with another request's choice response, and an unknown `plan_7`, all
  rejected before private `reviewPlanRef` resolution;
- canonical package and digest fixtures covering object insertion order,
  process restarts, Windows/Unix envelope line endings, JSON escaping,
  combining characters and astral symbols without normalizing stored evidence;
- compressed snapshot round trips plus corrupt/truncated/trailing-byte, wrong-
  length, wrong-digest and unknown-codec cases, all rejected before parsing;
- a retry after provider settings and adapter code change, proving the frozen
  provider/model/instruction/schema/package envelope is used with no silent
  model substitution;
- captured outbound requests proving the adapter uses one non-streaming
  Responses POST to the approved OpenAI host/path with `store: false`, no tools/
  continuation, the exact schema/package and the calibrated timeout/options;
- a retryable provider error with `generateText` configured at `maxRetries: 0`,
  plus a deliberately retrying fake SDK/fetch path, proving the one-shot
  boundary permits at most one network invocation for one persisted dispatch;
- receipt-bearing malformed output/refusal and a post-boundary SDK/network error
  without trustworthy usage, proving the former records exact usage while the
  latter becomes unresolved maximum exposure and cannot start another attempt;
- a registered global AI SDK telemetry integration and Node diagnostics-channel
  subscriber, proving explicit per-call telemetry disablement exposes no
  prompt, package, output or provider body;
- a hostile `OPENAI_BASE_URL`, gateway-related environment variable, redirect,
  non-TLS URL, alternate port and unexpected Responses path, each rejected or
  ignored before private data leaves the process;
- an AI SDK/provider upgrade that adds or changes a body field/default and an
  old compressed codec/invocation manifest, proving exact compatibility or
  `provider_configuration_drift` fallback without silent request changes;
- a provider timeout immediately below and above the frozen hard deadline,
  proving the hard deadline precedes lease recovery and no hidden retry occurs;
- configuration drift while the feature remains authorized, which may use the
  frozen default, versus account/platform control disable—including an
  operational kill action—and entitlement loss, which must remain fail-closed;
- a renderer registry matrix covering every candidate family, section purpose,
  claim/attribution kind, availability, currency and partial-coverage variant,
  plus a planted missing-template combination that must fail closed;
- sections with necessary local covered-subset denominators beside a review-
  wide limitation, proving `incompleteRecord` owns the generic coverage sentence
  exactly once;
- deliberately inactive AI Reviews or missing/invalid provider configuration at
  request creation, which must not create a snapshot or deterministic fallback;
- process termination before the committed transport boundary, after that
  boundary, after a response but before issuance and inside the issuance
  transaction, proving fenced recovery, no duplicate call/issuance/notification
  and conservative unknown-cost exposure only when the boundary was crossed;
- process termination after the committed `transport_may_have_started` boundary
  but before the network call, proving conservative unresolved exposure without
  resending that attempt, starting another provider attempt or fabricating an
  actual receipt;
- a late exact receipt replacing—not adding to—unresolved maximum exposure;
- actual provider usage one token and one cost unit over reservation, proving the
  exact receipt is retained, `reservation_overrun` is raised and subsequent
  provider spend is blocked without rewriting the issued review;
- backup/restore with reserved, dispatch-boundary-crossed and already-issued
  dispatch rows,
  proving the prior runtime is stopped, the recovery epoch advances, every
  copied lease is fenced even before its former expiry and bounded
  reconciliation occurs before scheduler work;
- a response from a pre-restore worker after the restored database is
  authoritative, proving the stale epoch cannot settle selection or issue;
- account erasure while a provider call is in flight, proving its late result
  cannot recreate private rows, issue a review or notify;
- an engine, scope, renderer or output-safety failure that must remain failed
  and cannot use deterministic fallback;
- a request retried after renderer code changes to prove its previously frozen
  visible plan text does not change;
- identical factual inputs under two account scopes to prove isolation and
  account-scoped prompt-safe references.

### Deterministic and metamorphic checks

The focused engine verifier must also prove invariants that do not depend on
one planted fixture:

- reordering equivalent input arrays does not change candidate references,
  measurement/claim/bridge/focus references, measurements, scores or ranks;
- a duplicate day, trade or rule outcome is rejected rather than double
  counted;
- every measurement numerator is a duplicate-free subset of its denominator,
  and changing the number of events on one trade cannot change a trade-unit
  candidate's affected count;
- making a complete behavioral cohort's net P/L more adverse cannot lower its
  adverse-net financial component when every other input is unchanged;
- increasing only gross losing-member P/L in a still-net-profitable behavioral
  cohort can change its displayed loss composition but cannot manufacture an
  adverse-net money score; explicit loss-concentration families remain monotonic
  in gross loss share;
- spreading the same affected observations across more cadence-appropriate
  independent buckets cannot lower repetition;
- lowering evidence coverage cannot increase confidence;
- making an otherwise unchanged lane dimension unavailable cannot increase the
  candidate's lane score;
- changing only free-text notes cannot change candidate eligibility,
  measurements, scores or ranks;
- changing `explicit_not_reviewed` to `reviewed_broken` changes the correct
  reviewed numerator/denominator and completion count exactly once;
- adding new expected opportunities with `explicit_not_reviewed` leaves the
  reviewed broken rate unchanged, lowers review completion, raises only the
  explicit-disposition count and cannot create an improvement;
- a coverage shift beyond the versioned threshold cannot produce a clean rate
  improvement without a fixed common cohort;
- a material structural-stratum mix shift reproduces the standardized rate;
  reversing the raw direction forces mixed, while same-direction magnitude
  distortion above 50% lowers confidence;
- removing the largest primary member or any independent bucket reproduces the
  documented smallest direction-preserving outlier-resistance score; a sign
  reversal or hard-gate failure produces zero;
- a rule-version change prevents a cross-version improvement claim;
- mixed currency suppresses money dimensions without deleting valid counts;
- cross-month facts never enter the wrong month's financial measurements;
- replacing only prior weekly visible prose cannot change a monthly candidate,
  measurement, score, claim clause or allowed selection;
- earlier/later comparison evidence sets are disjoint, and removing overlapping
  evidence either creates two gate-passing remainders or makes the comparison
  unavailable;
- incomplete money coverage always exposes affected and money-eligible counts,
  cannot render a full-cohort money claim, cannot label covered-subset P/L as
  the period total and contributes no money-based ranking dimension;
- sample confidence uses the weakest declared affected/comparison/early/later
  population, so enlarging only the unrelated remainder cannot make a tiny
  affected cohort perfectly sufficient;
- close-date result ownership, execution-event ownership and dated note
  ownership remain distinct under cross-month trades and timestamp changes;
- changing only trade style cannot change the all-closed-trade result headline,
  but it changes the appropriate declared-style eligibility; an unknown style
  cannot be relabelled as Day/Swing, while Swing, other, multi-market-date and
  needs-relink records never enter Daily Trade Analyzer ranking;
- a Swing note/style is joined only through its exact source identity/revision;
  ticker/date/array-order collisions cannot reattach it;
- provider serialization cannot alter the frozen engine snapshot;
- provider serialization emits only recursively allowlisted prompt-safe fields;
  adding any unknown/private/internal field fails even when context remains;
- provider serialization never emits an unselected trade's raw one-minute/
  five-minute Analyzer observations, and every selected excerpt contains only
  fields referenced by that candidate's server-owned claims;
- legacy unversioned RSI remains ranking-unavailable; changing a repeated
  corrected calculation-version RSI 14 cohort changes its deterministic
  aggregate exactly, while one isolated reading that fails recurrence/comparison
  gates cannot create a period-level finding;
- package, provider exception, support and Admin logging contains no raw note,
  historical review, provider prompt or rendered private review text;
- every normalized source snapshot is transactionally consistent across
  Journal, rule, note, Analyzer and issued-focus reads;
- an idempotent request race returns one request and its one winning insight
  snapshot while discarding any losing calculation, including a different
  later-state digest;
- generation contract is immutable from request through attempt, dispatch and
  issued row; v2/v3 attempt or output substitution always fails;
- the singleton generation contract advances at most once from v2 to v3,
  request creation reads it in the insert transaction and no current-time/code-
  default value can substitute for it;
- an existing v2 period identity is never upgraded or duplicated after v3
  activation, and a mixed v2/v3 month retains all actually issued weekly rows;
- no v3 activation is possible while any v2 request, attempt, reservation or
  receipt is pending/unreconciled, and no old writer can omit the required
  generation contract after migration;
- a retry reads the original shortlist after later Journal edits;
- moving the source review's issuance timestamp later excludes every trade,
  event and day aggregate that occurred before the focus was actually issued;
- superseding a tracked baseline's source version prevents ordinary follow-
  through; only a complete same-version canonical reconstruction can create the
  explicitly revised baseline path;
- overlapping candidates cannot create an additive or causal combined-loss
  measurement;
- cohort net P/L, affected losing-trade P/L and affected counts cannot be
  substituted for one another in prose;
- equal display literals from semantically different measurements cannot be
  substituted because their `claimRef` and server fact clause differ;
- raw provider prose or any unknown response key fails strict schema validation,
  and an internal cross-claim `bridgeRef` prevents section-plan creation;
- the provider must return the current short `providerPackageKey` and only an
  authorized request-local `providerChoiceKey`; the server resolves them to one
  frozen whole `reviewPlanRef`, and the provider cannot select a finding or
  section plan directly;
- a package/choice pair or private plan reference from another request cannot
  validate against the current request, source snapshot, period or package
  digest;
- same-subject improvement/friction sections require distinct purposes and
  primary measurements;
- section-plan claim order and rendered text are deterministic, and two valid
  sections cannot bypass global nonduplication, overlap, strength or focus
  checks by being combined later;
- two differently worded clauses with one `factualJobKey` collapse as one job,
  while similarly worded clauses with different metrics/populations remain
  distinct;
- plan ordering independently reproduces total lane-score loss, summed pairwise
  containment burden, focus connection, specificity and structural tie keys;
- every non-default retained plan independently reproduces the whole-review
  lane-loss cap and at least one threshold-level compensating benefit;
- section/review planning evaluates no more than 81 exact combinations and
  retains no more than six complete plans;
- shortlist and section alternatives respect evidence-cluster/action-target
  caps; same-cluster candidates cannot displace a distinct candidate inside the
  exact 10-score/five-confidence exception;
- no recurring/trend/contrast candidate below the visible-confidence and
  actionability floor can be promoted merely to fill a lane quota;
- every rendered periodic/monthly field stays within its exact character and
  sentence budget without cutting a claim;
- fixed-order canonical serialization produces byte-identical UTF-8 packages
  and digests regardless of object insertion order, locale, process or host line
  endings, while distinct user-authored source code points remain distinct;
- compressed persistence round-trips to those exact canonical bytes, and any
  codec, length, digest, truncation or trailing-byte defect fails before parse;
- the renderer coverage registry is complete for every activatable combination;
  removing one template fails snapshot creation rather than suppressing the
  finding or using a generic sentence;
- review-wide limitation language has exactly one `coverageJobKey`, while local
  affected/money-eligible denominators remain attached to their own claims;
- negative zero, sign wording, count grammar, partial labels and omitted unsafe
  note excerpts cannot alter measurements or create unsafe final text;
- a sparse partial week cannot receive full-week trend-consistency weight;
- equivalent facts in two account scopes produce equal score/rank tuples and
  the same semantic selected-finding set, while prompt-safe references differ
  and snapshots never cross-read;
- rotating only the prompt-safe HMAC key may change new scoped evidence
  references but cannot change structural tie keys, scores or semantic order;
- rotating the HMAC secret after snapshot creation cannot change the frozen
  package key or break retry validation; a forced package-key collision fails
  atomically;
- instruction-shaped text in a note cannot affect measurements, ranks or
  allowed selections; the literal value of a custom rule title or tag may
  affect only its ordinary subject identity, display label and exact cohort
  grouping, never execute as an instruction or bypass a gate;
- causal, guaranteed-capture and `statistically significant` prose is rejected
  unless the exact claim type is supported (this engine performs no statistical
  significance test);
- invalid candidate, measurement, claim, bridge, trade, note, focus-target and
  focus-question references all fail before issuance;
- every `not_available` clause preserves the difference between no supported
  pattern and insufficient or non-comparable evidence;
- an earlier focus target cannot be repeated through cosmetic rewording;
- a raw next-focus question or a `focusQuestionRef` authorized for a different
  target is rejected;
- provider success issues only its selected frozen v3 plan, while provider
  blockage/failure issues the byte-identical frozen default with
  `deterministic_default` provenance and no invented provider receipt;
- simultaneous provider success and deterministic fallback produce one atomic
  pending-to-issued winner, one accepted audit and one ready notification;
  a late real provider result can settle actual usage but cannot issue;
- repeated fallback invocation is idempotent and returns the existing review;
- provider/model/instruction/schema settings changes cannot alter a frozen
  retry or silently substitute a model; eligible operational drift uses the
  default, while account/platform disable and entitlement-revocation gates
  remain fail-closed;
- ambient endpoint/gateway variables and SDK/provider upgrades cannot change the
  frozen provider API family, approved host/path or canonical invocation
  manifest;
- one persisted dispatch can cross the one-shot fetch boundary at most once;
  SDK retry, repair, tool, continuation or streaming behavior cannot create a
  hidden second provider request;
- every post-boundary exception either records trustworthy exact usage or enters
  `usage_unknown_after_dispatch`; an error class/status cannot manufacture a
  zero-cost failure or authorize another provider attempt;
- explicit `store: false` and disabled call telemetry remain true in the final
  outbound body/runtime even when provider defaults or global telemetry
  registration change;
- removing a historical codec or invocation-manifest decoder while any
  unerased snapshot references it fails compatibility verification;
- an expired lease before the dispatch boundary creates no usage exposure,
  while an expired lease after that boundary retains one unresolved maximum
  exposure, cannot issue its provider result and cannot start another provider
  attempt;
- a late exact receipt replaces unresolved exposure without double-counting it;
- actual usage above a reservation is persisted exactly and becomes the spend-
  control amount with an overrun flag; it is never clipped or discarded;
- restoring a database requires exclusive runtime authority, advances the
  recovery epoch and fences every copied lease before creating a new attempt,
  resending work or issuing fallback;
- account erasure removes the scope and permanently prevents any in-flight or
  late provider result from recreating or issuing it;
- an over-context or refused full provider package is never truncated or split
  and issues the same complete-local-source default without a provider call;
- adding eligible trades that never reached a behavior's declared opportunity
  changes period prevalence but cannot change the conditional opportunity rate;
  moving a member into/out of the opportunity set changes only the declared
  denominator and all affected subset relations remain valid;
- preserving the same overall optional-source coverage while concentrating it
  in one week or result polarity triggers the fixed-stratum skew state, weakens
  confidence and cannot retain period-wide language;
- equal or better outcomes in a behavioral comparison produce no full adverse-
  consequence factor even when the affected cohort contains large losses;
- multiplying every same-currency P/L by one positive constant leaves financial
  ranks unchanged, while adding only unrelated profitable P/L cannot increase a
  negative candidate's period-magnitude component;
- a 100%-of-loss-pool candidate with a tiny period-magnitude share cannot equal
  the score of a candidate that is material under both denominators;
- a latest sufficiently populated adverse reversal reproduces the fixed
  improved-then-regressed verdict, while an otherwise identical sparse latest
  partial bucket cannot flip it;
- mixed/comparison representative roles select from both exact sides when both
  exist, and exhausting the eight-excerpt projection cannot replace the required
  counterexample with another same-side outlier;
- replacing only weekly prose cannot change the decision-critical spine or the
  selected primary conclusions even though the four issued reviews remain in
  the provider package;
- a review with an actionable selected held-back finding places its exact
  retrospective question first; a result-only outlier or unavailable
  opportunity follows the documented exception instead of producing advice;
- every opening begins with the exact period activity/result clause and has no
  more than one eligible emphasis, independent of provider selection;
- inserting a paused interval removes only the exact rule opportunities inside
  it, leaves unrelated candidates unchanged and cannot convert those targets to
  `not_reviewed`; retirement at issuance makes the rule-bound future target
  untrackable without rewriting the historical finding;
- moving a preset `trigger` event without moving its identity-linked
  `violation` cannot change which execution is named as the break; status-only
  custom evidence can never manufacture either event;
- changing applicable rule outcomes from `explicit_not_reviewed` to
  `reviewed_followed` can create a complete-rule-set strength only when every
  declared required member is now followed; merely deleting a broken row cannot
  create one;
- deleting an explicit not-reviewed row creates `expected_review_missing`, not
  another not-reviewed result; reviewed broken rate is unchanged, recorded-
  disposition coverage falls and no clean-process strength appears;
- deleting every review row for a target that the historical custom-rule
  projection still includes creates expected-missing coverage, while deleting
  the target/projection removes the opportunity; neither operation can create a
  day opportunity for a trade-only rule or pool a `both` rule's target units;
- changing a typed preset `n/a` from proven non-applicable to evaluation-
  unavailable changes only the availability audit, never the reviewed-rate or
  expected-opportunity denominator; an unknown free-text limitation cannot
  change either state;
- adding an exact preset evaluated-broken result to a target with a missing or
  explicit-not-reviewed disposition changes only the evaluator candidate/rate;
  review completion and trader-attributed wording remain unchanged;
- adding a conflicting followed/broken trader disposition suppresses evaluator-
  specific interpretation for that target, records the source conflict once
  and cannot create two same-rule findings;
- adding profitable trades before a late-day violation changes full-day outcome
  context but leaves the evaluator-bounded post-violation cohort, financial
  rank and affected P/L unchanged;
- removing the typed affected-execution set from an otherwise identical broken
  day rule preserves status/repetition evidence and full-day context but makes
  financial consequence unavailable;
- preserving raw cohort outcomes while shifting fixed style/direction/week mix
  reproduces the standardized consequence result; a direction reversal becomes
  composition-confounded and a material rate/median conflict becomes mixed;
- changing only relative dollar scale beyond the 0.5-2 boundary disables the
  median-P/L consequence branch when risk/size facts remain unavailable, while
  exact cohort dollars and a valid rate branch remain unchanged;
- duplicating trades/events on one latest market date cannot satisfy the two-
  date recency gate or turn a recent outlier into a monthly regression;
- adding or changing an affected note cannot change rank/status/spine, but a
  selected representative with safe context deterministically activates the
  attributed context-qualified clause and never creates inferred motive;
- once a follow-through assessment freezes its later-member set, reusing only
  those members produces no new candidate; adding a new independent member
  restores eligibility and the exact unassessed/repeat selection rule applies;
- adding an open-at-period-end lifecycle without a close leaves every closed-
  trade P/L measurement unchanged, increments only the confirmed-open count and
  adds the no-unrealized-P/L clause; later closure never rewrites the issued
  review;
- adding an in-period position reduction to that still-open lifecycle increments
  only the reduction-boundary count; neither the reduction nor a later closing
  result can enter the already-issued period P/L;
- changing only a displayed percentage to its equivalent count/denominator form
  leaves every score and rank unchanged, while no rate template can omit the
  underlying `x of y` facts;
- moving the top two distinct lane candidates inside the five-point margin or
  changing the leave-one-bucket winner changes certainty to `near_tie` without
  changing deterministic selection; restoring stable separation permits the
  dominant wording and no provider choice can upgrade it;
- removing every closed trade from an otherwise upstream-eligible request makes
  period P/L/win-rate unavailable and cannot promote reflections, missing rule
  reviews or recordkeeping into a recurring candidate;
- one authorized plan short-circuits provider selection only after normal
  activation/configuration/authorization and records `single_authorized_plan`;
- a deterministic fallback is impossible after any scope, entitlement,
  account/platform feature-control, source, engine, renderer, safety, contract,
  persistence or stopped-request failure, or invalid provider configuration at
  request creation;
- a retry after renderer deployment changes returns the original rendered
  output digest;
- existing v2 rows and both v3 generation sources parse to the same visible
  customer shape without rewriting v2 history; and
- after the first v3 row, a v2-only runtime cannot pass the compatibility gate
  and an older database restore cannot replace the authoritative history.

An independent reference calculation verifies closed-period totals, period-end
open-position count, active-interval rule opportunities, preset event identity,
rule-cohort P/L, loss/profit shares, coverage/comparability-gated comparisons,
weekly rates, medians, every applicable component score, normalized lane
weights, post-lane penalties,
allowed alternatives, final ranks, section-plan ordering, bounded global-plan
retention, default review plan and rendered-output digests without calling the
implementation's aggregation, scoring, plan-builder or renderer helpers.

## Performance and resource boundary

The owner computer may be resource constrained. Candidate generation must be
bounded approximately by trades plus rule outcomes plus Analyzer events, using
maps and precomputed denominators. Do not compare every trade with every other
trade.

- One pass builds indexes and period totals.
- Trade-style plans and dated Swing notes are batch-read inside the same source
  snapshot; no per-trade query is permitted.
- Family generators consume those indexes.
- Population member sets are canonicalized/interned once by digest and
  referenced by candidates/measurements rather than copied into every score and
  claim. Exact members remain reproducible from the private snapshot.
- Composition and leave-one-out sensitivity uses family preaggregates plus the
  bounded market-day/week buckets; it cannot rescan every candidate against
  every trade or invent arbitrary strata.
- Evidence overlap uses compact reference sets only after semantic clustering
  and the 50-candidate-per-lane bound.
- The engine emits a bounded shortlist regardless of raw trade count.
- Section planning evaluates at most 81 exact section combinations and retains
  at most six complete plans; focus questions and claim/bridge construction
  cannot multiply beyond those declared bounds.
- Focused benchmarks record normalization time, candidate count, insight-
  snapshot bytes, section/review-plan count, renderer time and peak process
  memory for 10-, 80-, 100- and 420-trade inputs. Snapshot storage and provider-
  token cost are reported separately.
- The storage benchmark reports canonical versus compressed bytes, peak
  compression/decompression memory, backup size and projected one-year growth
  for weekly-plus-monthly and Monthly-only cadences. It proves large source and
  package strings are not simultaneously copied through avoidable intermediate
  JSON values.
- Lease recovery scans an indexed bounded batch and processes one dispatch at a
  time; it cannot load all pending packages or all account evidence into memory.
- Provider preflight measures one frozen complete package against the configured
  model envelope. It does not make repeated trial calls or create a multi-stage
  model workflow merely because the exact-month evidence is large.
- Each persisted dispatch permits at most one audited outbound fetch. Retryable
  errors, structured-output failure, timeout and provider refusal cannot produce
  hidden SDK retries, repair calls, tool steps or continuation requests.
- The captured invocation fixture reports request-body validation and adapter
  overhead without retaining the private body; telemetry remains disabled and
  cannot copy the package into a second observability buffer.
- A new safety limit requires measured database/provider evidence and a plan
  update; no arbitrary trade-count or snapshot-byte refusal is introduced.
- Focused static scripts and type checks run with one worker where applicable.
- Do not run Vitest, broad regression or production builds during active
  implementation.

## Observability and support audit

For each generated review, retain server-side:

- insight-engine version;
- active generation-contract singleton, minimum compatible reader contract and
  first-v3 activation/request/issuance identities;
- candidate counts by family and lane;
- candidate observation units, result/event ownership, trade-style coverage,
  population-set digests/counts and source-lineage status;
- complete shortlisted candidate measurements and ranks;
- component applicability, raw values, normalized weights and calculation
  traces for every shortlisted score;
- eligibility gates, confidence adjustments, penalties and sensitivity results;
- adverse/beneficial net contribution beside gross loss/profit composition,
  partial-money score availability, weakest required sample population,
  standardized mix-shift result and outlier-resistance result;
- provider selections and request-local choice-key resolution;
- authorized review-plan count, default/selected `reviewPlanRef`, renderer and
  selection-schema versions, frozen provider/model/envelope identities,
  canonical/compressed provider-package byte counts, token counts and digest,
  rendered-output digest and generation source;
- immutable generation-contract, provider-adapter, provider-invocation-manifest,
  exact AI SDK/provider package versions and canonical outbound-manifest digest;
- approved provider API family/host/path, bounded timeout, one-shot fetch count,
  explicit retry/storage/telemetry/tool/continuation settings and Railway direct-
  OpenAI runtime mode, never the API key, authorization header or raw body;
- rejected-attempt selection errors;
- deterministic-fallback reason when used;
- database-recovery epoch, dispatch lease generation/state, nullable
  `transport_may_have_started_at_utc`, issuance compare-and-set winner, accepted-
  audit/notification identity and any bounded recovery/late-provider settlement
  code;
- final section-to-finding references;
- focus-tracking metadata;
- provider usage and cost through the existing receipt system, including real
  failed/late calls, with no receipt or cost created for a provider call that
  did not occur;
- post-boundary outcome class (`exact_usage` or
  `usage_unknown_after_dispatch`) and the evidence that allowed any pre-boundary
  zero-usage classification;
- unresolved maximum-cost exposure for calls whose committed dispatch boundary
  was crossed but usage is unknown, reported separately from actual receipt
  cost and never added after an exact receipt replaces it; and
- reservation-overrun count and exact excess, with subsequent provider-call
  block state, never substituted for or deducted from actual usage.

Journal notes and private identities retain their existing privacy boundary.
Admin aggregate health views may later report candidate/selection counts,
compressed sizes, lease health and unresolved cost exposure but must not expose
private review prose, packages, notes or trade facts. Operational errors are
normalized to bounded codes before logging or persistence.

## Failure handling

- **Generation-contract singleton is missing, duplicated, invalid or below the
  database's compatibility floor:** fail startup/request creation before any
  provider work; do not infer a contract from code or existing snapshot rows.
- **Cutover finds pending or unreconciled v2 work:** keep request intake and v3
  activation stopped. Do not migrate the request onto v3, assume a call did not
  occur or manufacture a terminal receipt.
- **Old writer omits/mismatches `generation_contract_version`:** reject the
  request/attempt before provider dispatch. A v2 attempt/output can never service
  a v3 request and vice versa.
- **A v2-only binary is proposed after a v3 row exists:** reject rollback below
  the compatibility floor. Keep generation disabled on a v3-capable reader and
  forward-fix instead; never restore an older database over issued history.
- **Outbound endpoint/body or invocation manifest differs from the frozen
  contract:** reject before network I/O and, when every normal authorization and
  engine/safety gate still passes, issue the frozen default with
  `provider_configuration_drift`.
- **The SDK tries a second fetch, repair, tool step or continuation:** the one-
  shot transport rejects it. If the first dispatch boundary was crossed, retain
  unknown maximum exposure and use only deterministic fallback; never start a
  replacement provider attempt.
- **Provider timeout fires:** abort at the frozen hard deadline before lease
  recovery, treat the boundary-crossed call conservatively and do not rely on
  client-library retry.
- **SDK/provider error or invalid structured output arrives after the transport
  boundary:** persist an exact receipt when trustworthy usage exists. Without
  trustworthy usage, record `usage_unknown_after_dispatch`, retain maximum
  exposure and prohibit another provider attempt regardless of error label or
  HTTP status.
- **`store: false`, telemetry disablement, official OpenAI endpoint or another
  privacy-critical invocation setting cannot be verified:** fail the provider
  path before sending the private package. A previously valid, fully authorized
  snapshot may issue only its local frozen deterministic default; no fallback
  is permitted to send data across the uncertain boundary.
- **Railway lacks the approved Node runtime, direct OpenAI egress/API key,
  persistent `/data` or single-writer process boundary:** leave hosted AI Review
  generation inactive. The Vercel AI SDK package name is not a reason to add a
  Vercel hosting or gateway dependency.
- **Population membership is duplicated, crosses its denominator, mixes units
  or fails source reconciliation:** fail snapshot creation as an engine defect;
  do not repair counts, silently drop members or call the provider.
- **Trade style is unknown, unclassified, stale or needs relinking:** retain the
  trade in close-date outcome facts and suppress only style-sensitive process
  candidates. Never infer Day/Swing. Unknown historical style may retain an
  objective same-market-date Analyzer candidate, but it is not called trader-
  declared Day intent; stale/needs-relink and contradictory Swing/other do not.
- **A prior focus baseline source was superseded:** use an explicitly revised
  baseline only when the complete canonical old population can be reconstructed
  under the same metric/version; otherwise mark follow-through unavailable.
- **Raw improvement reverses after declared mix standardization:** emit mixed,
  not improved. Missing required strata makes the comparison unavailable.
- **Rule outcome row is absent:** record `expected_review_missing` only for a
  proven active applicable opportunity. Do not synthesize not-reviewed,
  followed or broken. If applicability itself is unavailable, suppress that
  target from rate denominators and expose the bounded availability reason.
- **Preset evaluator reports `n/a`:** use only the typed local reason mapping.
  Unknown or untyped reasons are evaluation-unavailable; never parse the
  limitation text or send it to the provider.
- **Preset evaluator has an exact result but no trader disposition:** retain an
  evaluator-attributed candidate under its own coverage/rate; do not count it as
  completed review. A conflicting saved followed/broken disposition instead
  activates the existing status-only conflict boundary.
- **Broken day rule lacks a typed affected-execution set:** retain its exact
  status, repetition and full-day outcome context, but suppress financial-
  consequence rank and after-violation wording.
- **Eligible period has zero or sparse closed trades:** preserve the upstream
  request decision, state exact unavailable/result/example boundaries and do
  not manufacture a recurring finding from reflections or recordkeeping.

- **No eligible friction:** use the engine-authorized mixed-result or measured-
  strength fallback when one exists. Say that no qualifying held-back pattern
  was found only when the reason is `no_qualifying_pattern`; state the actual
  coverage or missing-fact boundary for every other reason. Do not manufacture
  either a problem or a clean-process conclusion.
- **No eligible improvement:** provide the most informative unchanged or mixed
  or worsening weekly comparison; when no compatible baseline exists, state
  that boundary and use a measured maintained strength instead of generic
  boilerplate.
- **No strength:** do not force praise unsupported by the record.
- **No measurable earlier focus:** explain that exact tracking was unavailable
  and generate measurable focus metadata for the next review.
- **Missing Analyzer:** continue with rules, results, tags, notes and chronology.
- **Missing reviewed rules:** continue with exact result and Analyzer families.
- **Insufficient money coverage:** suppress unavailable money scores and use
  counts/rates; when a valid subset remains, state both affected and money-
  eligible counts in its server-rendered fact clause. Version one never ranks
  from that partial covered-subset amount.
- **Provider selects an invalid or unknown plan:** reject that attempt. Persist
  its trustworthy exact usage when supplied; otherwise record
  `usage_unknown_after_dispatch`. Issue only the frozen deterministic default
  and never send the package again.
- **Exactly one authorized plan exists:** after normal activation,
  configuration and authorization, issue it as a deterministic single-plan
  result without a pointless provider call or receipt.
- **After feature/provider activation and ordinary request authorization, a
  local pre-boundary reservation fails or the one permitted provider call ends
  without an acceptable selection:** issue the frozen deterministic-default
  review plan when it already passed every engine, renderer, output-safety and
  v3 contract check. Record the precise fallback reason,
  `deterministic_default` source and exact-or-maximum exposure without inventing
  provider usage or a receipt. This is the same evidence-backed rendered plan,
  not a generic degraded review.
- **Complete provider package exceeds the configured safe model envelope:** do
  not truncate, summarize or split the frozen projection. After the normal
  activation and authorization gates, issue the deterministic default already
  calculated from the complete local source with `provider_input_limit` and
  make no provider call.
- **Pinned provider/model/envelope becomes unavailable after valid request
  creation:** never substitute a new model or rebuild the package. If scope,
  entitlement and both account/platform feature controls still allow issuance,
  use the frozen default with `provider_configuration_drift`.
- **Provider configuration is invalid at creation, either account/platform
  feature control is disabled—including an operational kill action—or
  entitlement is revoked:** fail closed; no snapshot/default may bypass the
  controlling gate.
- **Provider response arrives after fallback won issuance:** preserve any real
  usage/receipt on that attempt and record the bounded late-result state, but do
  not validate its choice, replace the issued output or notify again.
- **Provider success and fallback arrive together:** the atomic pending-to-
  issued transition chooses one winner. The loser idempotently reads the issued
  review and cannot create another accepted audit or ready notification.
- **Worker dies before provider dispatch:** expire/fence the lease, fail the
  attempt without usage exposure and continue only through the bounded retry
  policy.
- **Worker dies after the committed dispatch boundary:** fence the attempt for
  selection, retain its maximum reservation as unresolved exposure and never
  invent an actual receipt or make another provider attempt; reconcile an exact
  late receipt if one becomes available and otherwise issue only the frozen
  deterministic default after recovery.
- **Actual usage exceeds the reservation:** store the exact receipt and flag
  `reservation_overrun`; use actual cost in spend controls and block subsequent
  provider calls under the bounded control policy. Never clip or reject factual
  usage merely to preserve the estimate.
- **Compressed snapshot cannot reproduce its canonical length/digest:** fail
  closed before provider, rendering or issuance; never regenerate it from later
  Journal state.
- **Account is erased while transport is in flight:** discard the result. It
  cannot recreate scoped history, issue, notify or persist erased private data.
- **Renderer registry lacks a required template:** fail snapshot creation as a
  renderer defect. Do not hide the candidate or misreport that the trader had no
  qualifying pattern.
- **Scope, entitlement, account/platform feature controls, provider-
  configuration-at-creation, source snapshot, engine arithmetic, renderer,
  output-safety, contract-version or persistence integrity fails, or the request
  was stopped:** fail closed under the existing request state. Deterministic
  fallback is continuity for a valid activated request, never a way to activate
  or bypass these boundaries.

## Planned implementation ownership

Implementation is limited to the following owned files and directly related
focused verifier changes. If source audit proves another file necessary, this
plan must record it before that file is edited.

### New source

- `src/modules/coach/contracts/coach-ai-review-insight-contracts.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-normalizer.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-measurements.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-candidates.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-source-adapters.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-ranking.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-shortlist.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-canonical.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-selection-validator.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-renderer.ts`
- `src/modules/coach/server/coach-ai-review-insight-repository.ts`
- `src/modules/coach/server/coach-ai-review-insight-openai-adapter.ts`
- `src/modules/coach/server/coach-ai-review-generation-compatibility.ts`
- `src/modules/coach/server/coach-ai-review-insight-dispatch-recovery.ts`
- one next-available forward Coach insight migration under
  `src/modules/coach/server/database/migrations/`
- `src/scripts/verify-coach-ai-review-insight-engine.ts`
- `src/lib/trade-candle-analysis/indicator-context.test.ts`
- one synthetic true-month fixture/helper under `src/scripts/`

### Existing source permitted to change

- `src/modules/coach/contracts/weekly-ai-review-input-contracts.ts`
- `src/modules/coach/contracts/weekly-ai-review-output-contracts.ts`
- `src/modules/coach/contracts/monthly-ai-review-output-contracts.ts`
- `src/modules/coach/server/coach-ai-review-supplemental-evidence-repository.ts`
- `src/modules/coach/server/coach-weekly-ai-review-input-service.ts`
- `src/modules/coach/server/coach-weekly-ai-review-input-runtime.ts`
- `src/modules/coach/server/coach-monthly-ai-review-input-runtime.ts`
- `src/modules/coach/server/coach-ai-review-request-service.ts`
- `src/modules/coach/server/coach-ai-review-repository.ts`
- `src/modules/coach/server/coach-ai-review-administration-repository.ts`
- `src/modules/coach/server/coach-ai-provider-settings-repository.ts`
- `src/modules/coach/server/coach-ai-review-provider-controls-repository.ts`
- `src/modules/coach/server/coach-ai-review-generation-coordinator-v2.ts`
- `src/modules/coach/server/coach-ai-review-provider-package.ts`
- `src/modules/coach/server/coach-weekly-ai-review-openai-adapter.ts`
- `src/modules/coach/server/coach-monthly-ai-review-openai-adapter.ts`
- `src/modules/coach/server/coach-ai-review-output-safety.ts`
- `src/modules/coach/server/coach-weekly-ai-review-issuance-service.ts`
- `src/modules/coach/server/coach-monthly-ai-review-issuance-service.ts`
- `app/(dashboard)/trade-tracker/[sessionDate]/day-session-types.ts`
- `app/(dashboard)/trade-tracker/trade-tracker-platform-data.ts`
- `src/lib/trade-candle-analysis/indicator-context.ts`
- `src/modules/level-analysis/contracts/candle-review-contracts.ts`
- `src/modules/level-analysis/contracts/daily-trade-analyzer-contracts.ts`
- `src/modules/level-analysis/server/candle-review-reporting.ts`
- `src/modules/level-analysis/server/daily-trade-analyzer.ts`
- `src/modules/level-analysis/server/daily-trade-analyzer-repository.ts`
- `src/modules/journal/server/trade-style/journal-trade-style-repository.ts`
- `src/modules/journal/server/swing-notes/journal-swing-note-repository.ts`
- `src/modules/journal/server/annotations/journal-rule-repository.ts`
- `src/modules/journal/server/annotations/journal-preset-rule-evaluator.ts`
- `src/modules/journal/server/annotations/journal-preset-rule-evaluator.test.ts`
- `src/modules/journal/server/executions/journal-execution-repository.ts`
- `src/modules/journal/server/round-trips/journal-round-trip-repository.ts`
- `src/modules/help/ai-reviews-guides.ts` only for the owner-approved final
  closed-trade/open-lifecycle, rule-state/coverage and event-bounded rule-
  evidence explanation;
- `src/modules/platform/server/database/platform-migration-manifest.ts`
- `src/modules/platform/server/privacy/platform-erasure-service.ts`
- focused AI Review provider/fixture verification scripts already under
  `src/scripts/`

### Documentation

- this plan;
- `docs/migration/ai-review-narrative-quality-progress.md`;
- `docs/migration/ai-reviews-beta-handoff.md` at final acceptance;
- `docs/migration/migration-progress.md` only when the implementation slice is
  complete and concurrent edits can be preserved safely.

The listed Journal repositories may receive only bounded account-scoped batch-
read methods for current linked style/Swing-note revisions, rule lifecycle and
period-end execution/round-trip state. The preset evaluator may add a backward-
compatible typed availability reason and bounded affected-violation member
projection without changing any followed/broken/`n/a` result, preset threshold
or Journal writer. No rule status, evaluator meaning, execution/round-trip
authority or stored Journal fact changes in this slice.

No dashboard presentation, Trade Tracker editor, Journal fact writer, legacy
V3 runtime, scheduler activation, hosted configuration or deployment file
belongs to this implementation. The explicitly listed AI Reviews guide remains
an owner-approved final copy boundary; any Privacy mismatch found at final
review becomes a separate owner-approved copy slice rather than being silently
bundled into engine code.

## Implementation slices

### Slice A - deterministic contracts and calculations

Implementation status on 2026-08-18: foundation in progress. The pure
contracts, measurement, comparison, generic candidate, rate-trend, lane-ranking
and bounded-shortlist primitives exist. The transactionally consistent,
account-scoped Journal/Analyzer source snapshot now also exists with versioned
prompt-safe references, canonical source bytes, current-linkage checks, exact
historical period-end open-position reconstruction and exact issued-review
history selection. It is not wired to requests, persistence or the provider.
Candidate-family boundary QA, exact representative selection, complete leave-
one-bucket rank stability and fixture execution remain before Slice A can be
called complete.

Implementation continuation on 2026-08-19: concrete adapters now generate the
period result, exact named-rule associations and trends, event-bounded preset
sequence findings, green-to-red/giveback/recovery paths, add-after-peak and
partial-exit sequences, specific strong-entry examples, result/process
contrasts, fixed ticker/tag/direction/weekday/time/duration cohorts and exact
trade/day concentration candidates. Session remains unavailable when absent,
custom rule titles are not semantically classified, and RSI generation is
implemented but hard-gated off until its permitted reference-vector check.
Stable tie keys independent of rotating prompt-safe HMAC references, exact
role-based representative selection and complete leave-one-calendar-week lane
replay are now implemented. The replay recalculates family eligibility,
classification, consequence, confidence and lane score from exact per-week
expected populations, reselects valid representatives, then reruns overlap,
diversity and the measured-consequence guard; it also removes result-only weeks
from period financial denominators for candidates with no opportunity in that
week. Final family/measurement QA and permitted fixture execution remain before
Slice A can be called complete.

- Correct and reference-verify RSI 14 under the immutable
  `wilder_rsi_14_v1` calculation version before enabling its candidate family;
  preserve unversioned snapshots, make their RSI ranking-unavailable and do not
  fetch market data for a backfill.
- Add engine contracts, prompt-safe rule/trade-style/Swing-note identity,
  rule lifecycle/preset evidence, explicit missing/not-reviewed/`n/a` state
  normalization, event-bounded day-rule members, period-end open-position and
  open-lifecycle-reduction boundaries, temporal ownership, population-
  membership validation and exact measurement helpers.
- Build normalization, style-homogeneous populations, denominators and
  candidate family generators.
- Add adverse/beneficial net-contribution scoring, partial-money suppression,
  weakest-population confidence, exact outlier/mix/consequence comparability,
  score explanations, penalties, overlap/diversity handling, lane rankings and
  rank-separation/sensitivity certainty.
- Add a count-only fixture harness with planted expected ranks.

### Slice B - provider shortlist and structured selections

Implementation status on 2026-08-19: the server-owned fact/focus renderer,
bounded complete-plan catalog, whole-plan alternative quality gate, canonical
public package, request-local private mapping, recursive package-key privacy
checks, strict three-field selection resolver and hardened host-neutral OpenAI
Responses selector are implemented but inactive. The selector pins the official
endpoint and Responses family, verifies the exact outbound body in a one-shot
fetch boundary and explicitly disables storage, telemetry, SDK retries, tools,
repair, continuation and truncation. Immutable compressed v3 persistence,
dispatch/recovery fencing, generation-contract migration, deterministic
issuance/fallback, v2 compatibility hardening, captured-request execution and
dual reads remain before this slice can be activated or provider-tested.

- Serialize the balanced insight brief ahead of permitted non-Analyzer source
  context, with long-term Analyzer aggregates and bounded representative
  excerpts instead of bulk raw one-minute/five-minute observations.
- Add server-owned fact, bridge and focus-question clause catalogs.
- Add count-and-denominator rate templates, sparse/no-closed-trade forms and
  dominance-calibrated certainty wording.
- Build bounded section plans and at most six globally compatible complete
  review plans with frozen rendered output.
- Enforce the whole-plan alternative quality gate and complete renderer-template
  registry before assigning request-local choice keys.
- Freeze canonical provider-package bytes and the request-local choice-to-plan
  mapping; add the strict selection schema that rejects raw provider prose and
  uses the reduced output-token ceiling.
- Enforce the recursive provider privacy allowlist/forbidden-field scan and
  store large canonical artifacts in verified versioned compressed form.
- Pin the non-secret provider/model/instruction/schema envelope and add fenced
  dispatch leases, bounded crash/restore recovery and unresolved-cost exposure.
- Add immutable request/attempt generation contracts, rebuild and reconcile the
  v2 tables without changing historical bytes, and bind each attempt/output
  family to its owning request contract.
- Add the versioned host-neutral OpenAI Responses adapter with official endpoint,
  `store: false`, telemetry disabled, `maxRetries: 0`, bounded timeout and the
  one-shot outbound request validator. Keep Vercel hosting/Gateway out of the
  runtime contract; the same Node adapter runs directly on Railway.
- Harden or make unreachable both legacy v2 provider adapters before any further
  live provider test; no old call site may retain implicit storage, retry,
  telemetry, endpoint or timeout behavior during the cutover window.
- Preflight the complete unsplit provider envelope against the configured model
  budget without omitting any required field from the bounded projection. Bulk
  raw Analyzer records remain in the local calculation source by design.
- Add v3 output/issued-review persistence, dual v2/v3 reads, exact provenance,
  deterministic fallback, single-winner issuance/notification and immutable
  retry/late-usage behavior.
- Preserve existing visible review fields and all legacy v2 output reads.

### Slice C - weekly focus tracking

- Store hidden target metadata for newly issued weekly and two-week focuses.
- Use the metadata in later weekly and monthly follow-through candidates.
- Store each accepted follow-through assessment's exact later-member boundary so
  unchanged evidence cannot be reviewed repeatedly.
- Preserve lower-confidence compatibility for already-issued reviews.
- Detect corrected/excluded/relinked baseline source versions and permit only
  an explicit complete canonical revised-baseline path.

### Slice D - true-month live acceptance

- Generate four sequential weekly reviews and one monthly review from both the
  420-trade stress fixture and the 80-trade realistic fixture through the
  ordinary issuance flow.
- Prove all four issued weekly reviews entered the monthly package.
- Prove mixed Day/Swing/other/unclassified result coverage while every style-
  sensitive and Daily Trade Analyzer candidate keeps the correct population.
- Inspect deterministic ranks before provider generation.
- Save, reopen and audit the monthly result.
- Exhaust provider attempts in a separate run and prove the exact frozen
  deterministic default is issued/reopened without a fake provider receipt.
- Race a delayed provider result against fallback and verify one issued review,
  one accepted audit, one ready notification and truthful late usage.
- Crash/restart each dispatch/issuance boundary, restore a pending database only
  after stopping its former runtime, advance the recovery epoch, then erase an
  account in flight; prove every copied lease is immediately fenced, no stale
  runtime can issue, no data is resurrected and actual versus unresolved cost
  accounting remains correct.
- Prove provider/model/settings drift cannot rewrite a frozen request and that
  account/platform disable and entitlement revocation remain fail-closed.
- Rehearse the no-pending-v2 cutover, table rebuild/backfill, old-writer fences,
  mixed-v2/v3 first month and post-v3 rollback floor on a disposable copy.
- Capture the final outbound request through a fake transport and prove one
  Responses POST, official endpoint, exact allowlisted body, `store: false`, no
  telemetry/hidden retry and timeout-before-lease ordering using the exact
  installed AI SDK/provider versions.
- Verify the adapter is host-neutral under a Railway-shaped Node environment;
  real Railway secrets, persistent volume, worker and OpenAI data controls remain
  separate hosted activation gates and are not changed by this slice.
- Verify below/above-context packages remain complete and choose provider or
  deterministic issuance without truncation or splitting.
- Run bounded non-persisted stability replays.

### Slice E - documentation and handoff

- Record exact accepted formulas, engine version, known limitations and live
  outputs.
- Update the narrative-quality progress record and AI Review beta handoff.
- Record the no-mixed-writer cutover, generation compatibility floor and the
  fact that Vercel AI SDK is a host-neutral package used directly from Railway,
  not a Vercel hosting/Gateway dependency.
- Compare the exact provider field allowlist and immutable retention behavior
  with AI Reviews Help and Privacy language. Any visible correction requires
  owner copy approval; do not assume internal ranking alone makes the expanded
  monthly factual projection disclosure-neutral.
- Update the AI Reviews Help guide, subject to owner copy approval, to explain
  that displayed P/L is from trades closed in the review period and that the
  review discloses confirmed period-end open-position count without estimating
  unrealized P/L. The guide must not promise execution-level rule evidence when
  only a recorded status exists.

## Plan QA pass - 2026-08-18

The implementation-readiness QA pass checked the plan against the current v2
input contracts, monthly snapshot assembly, rule repository, Analyzer evidence,
request/attempt/issued-review schema and immutable retry flow.

Resolved findings:

1. **Full-month Analyzer loss at the provider deduplication boundary:** fixed by
   requiring local candidate calculation before represented weekly Analyzer
   detail is removed, then freezing the derived brief.
2. **No structured saved-plan object:** fixed by limiting plan-alignment claims
   to named rules or explicit trader-authored notes.
3. **Non-comparable Analyzer price moves:** fixed by prohibiting pooled money or
   percentage calculations from per-ticker price-move decimals.
4. **Unavailable size facts:** fixed by limiting add analysis to sequence/path
   evidence and sizing analysis to named sizing/risk rules until quantities and
   planned risk are accepted inputs.
5. **Null session and execution-detail fields:** fixed by keeping those families
   unavailable while preserving exact timestamp and duration alternatives.
6. **Undefined meaningful improvement:** fixed with versioned early/later
   denominators, rate and money/path thresholds, direction metadata and mixed-
   evidence handling.
7. **Exploratory ticker/tag false patterns:** fixed with predetermined buckets,
   no arbitrary intersections, sibling-group accounting, stronger gates and an
   exploratory-cohort penalty.
8. **Candidate/output version ambiguity:** fixed with a frozen engine version
   and deterministic candidate references.
9. **No immutable home for candidates and selections:** fixed with planned
   append-only insight snapshot and attempt-selection tables created by a
   forward migration.
10. **Provider could cite a valid candidate but invent a nearby number:** fixed
    by structured per-section measurement and trade references plus secondary
    prose scanning.
11. **One planted fixture could hide calculation bugs:** fixed with ordering,
    monotonicity, coverage, outlier, currency, cross-month, idempotency and
    retry metamorphic checks plus an independent calculation reference.
12. **Unbounded source scope:** fixed with a concrete implementation allowlist
    and explicit exclusions.
13. **A digest could not reproduce later-changed Analyzer evidence:** fixed by
    freezing the normalized calculation source, its digest, candidates and
    shortlist in the immutable insight snapshot.
14. **Free-text could become an untestable scoring classifier:** fixed by
    keeping notes as explanatory context for already-eligible findings rather
    than keyword-scoring them into patterns or motives.

## Second adversarial plan QA pass - 2026-08-18

The second pass tried to falsify the design with large/small-population
counterexamples, legitimate cross-lane subject overlap, concurrent request
creation, hostile user-authored text, high-cardinality candidate sets and a
less-obvious realistic month.

Additional resolved findings:

1. **Order-derived trade references contradicted reorder invariance:** fixed
   with account/period-scoped versioned HMAC references and exact evidence
   linkage.
2. **Eight occurrences received full count credit in both 20- and 420-trade
   months:** fixed with an adaptive population-based saturation target.
3. **Absolute-dollar scoring would rank account sizes inconsistently:** fixed
   by using comparable period-relative financial materiality while retaining
   exact dollars as visible measurements.
4. **Extreme ratios could exceed the declared 0-100 score contract:** fixed by
   clamping score dimensions while preserving raw values for display and audit.
5. **Coverage, outlier and contradiction weaknesses could be penalized twice:**
   fixed with an ordered gate/availability/confidence/penalty pipeline and exact
   version-one multiplicity and overlap schedules.
6. **Pairwise overlap could grow quadratically across every raw candidate:**
   fixed with semantic pre-clustering and a 50-candidate-per-lane comparison
   bound before the final 15-25 provider shortlist.
7. **One subject could not be both a real improvement and the largest residual
   problem:** fixed by requiring distinct finding references and measurements,
   not unrelated subjects.
8. **The no-improvement fallback contradicted lane-only validation:** fixed with
   engine-authorized section selection modes and mode-specific evidence checks.
9. **A valid selection could still produce vague prose:** fixed with section-
   specific minimum measurement, denominator, impact, example and verdict
   requirements.
10. **A concurrent loser could be incorrectly expected to match the winning
    snapshot digest:** fixed by keeping only the atomic winner and discarding
    every losing calculation without mixing state.
11. **Trader-authored text could contain prompt instructions:** fixed by
    treating notes, custom titles and tags as delimited untrusted data and
    adding an injection-invariance fixture.
12. **The 420-trade stress month was not representative product acceptance:**
    fixed by adding a separate 80-trade four-week-plus-month persisted fixture
    with messier coverage and subtler findings.
13. **Frozen calculation-source storage had no resource proof:** fixed by
    deduplicating referenced evidence and requiring separate snapshot-size,
    runtime and memory benchmarks before any new refusal limit is considered.
14. **Ticker-only saved notes could be attached to the wrong same-ticker
    trade:** fixed with a transient engine-only private evidence manifest and
    exact prompt-safe trade/rule note linkage before provider projection.
15. **The August fixture described four-week comparisons even though August 31
    creates a fifth calendar bucket:** fixed by using the declared five-bucket
    comparison and requiring the final partial week in pattern and follow-
    through measurements.
16. **The trend formula described only adverse movement:** fixed by applying
    each metric's declared beneficial direction and excluding context-only
    metrics from improvement scoring.
17. **Score rounding and unavailable-weight redistribution were ambiguous:**
    fixed with one deterministic weighted normalization, rounding rule and
    zero-floor after integer penalties.
18. **Trading after a green/red daily state could be mislabeled as a violation:**
    fixed by keeping the chronology factual and requiring a named boundary rule
    or repeated material harm for a negative process conclusion.
19. **An examination focus had no truthful directional verdict:** fixed with a
    bounded non-directional measured result that reports later evidence without
    inventing improvement or deterioration.
20. **The empty-friction fallback had no valid selection mode:** fixed with
    explicit mixed-result, measured-strength and truly unavailable paths rather
    than forcing the provider to manufacture a problem.
21. **A two-week recurrence gate made recurring weekly findings impossible:**
    fixed with market-date spread for weekly reviews and calendar-week spread
    for two-week/monthly reviews, including the segment and strength gates.
22. **The monthly trend gate incorrectly applied to later weekly comparisons:**
    fixed with separate monthly, two-week and compatible cross-request
    comparison shapes and honest two-point versus sustained-trend language.
23. **A one-trade outlier could still receive a high repetition formula score:**
    fixed by assigning zero repetition to explicit outlier and single-example
    candidates before lane scoring.
24. **The provider could cite the correct measurement but round or relabel it
    incorrectly:** fixed with server-generated display literals tied to exact
    measurement references and validated before issuance.
25. **Prompt-safe references lacked a persisted derivation version:** fixed by
    freezing the non-secret reference version in the immutable insight
    snapshot so later key/version changes do not make the audit ambiguous.

## Third adversarial plan QA pass - 2026-08-18

The third pass assumed every candidate reference and arithmetic result was
technically valid, then looked for ways the resulting review could still
mislead a trader or allow an implementation to pass weak tests.

Additional resolved findings:

1. **Associated cohort losses could be written as caused losses:** fixed with
   explicit period-result/cohort-association/Analyzer-path attribution and
   rejection of counterfactual or guaranteed-capture language.
2. **A rate could appear improved only because later review/Analyzer coverage
   changed:** fixed with identical eligibility definitions, exact coverage on
   both sides and a versioned 15-point drift boundary.
3. **Delayed review issuance could count trades that happened before the focus
   was delivered:** fixed by using the later of period seal and actual issuance
   timestamp, with stricter day-aggregate handling.
4. **Financial materiality still lacked one deterministic denominator per
   family:** fixed with exact loss-share, profit-share, reversal and retention
   mappings frozen in the engine version.
5. **Process relevance was descriptive rather than implementable:** fixed with
   a structural six-level score table that cannot be raised by keywords.
6. **Evidence confidence had no weights and still mixed fee/currency absence
   into confidence:** fixed with five exact applicable components while keeping
   unavailable money separate.
7. **Confidence implicitly required semantic classification of free text:**
   fixed by allowing only structured-source agreement to affect scores; notes
   remain attributed explanatory context.
8. **Specificity and several lane components were undefined:** fixed with exact
   additive specificity and definitions for persistence, financial change,
   baseline recurrence, consistency, divergence and focus span.
9. **A rule-followed loss could be called a controlled loss without planned
   risk data:** fixed by making strength outcome support unavailable for that
   case while preserving its process strength.
10. **The provider could self-authorize a lower-ranked alternative:** fixed by
    freezing server-calculated allowed alternatives and removing subjective
    coherence as an override.
11. **Duplicate-section validation had no structured distinction for one
    subject serving improvement and friction:** fixed with bounded section
    purposes and different primary measurements.
12. **Note-derived prose had no exact evidence reference:** fixed with
    `noteRefs`, explicit trader attribution and rejection of unreferenced note
    paraphrases.
13. **The provider could author hidden next-focus targets:** fixed with engine-
    owned distinct `focusTargetRef` choices tied to measurable findings.
14. **The planted fixtures lacked denominator-drift and overlapping-loss
    traps:** fixed by adding both with asserted pre-provider behavior.
15. **The independent reference check covered totals but not the full ranking
    path:** fixed by independently calculating every component, normalized
    weight, penalty, alternative and final rank.
16. **A sparse partial week could receive full-week consistency weight:** fixed
    with eligible-observation weighting and explicit partial-week display.
17. **Calibration and acceptance used the same visible fixtures:** fixed with a
    sealed realistic/edge-case holdout boundary and engine-version changes for
    post-failure recalibration.
18. **Calendar and isolation edge cases were absent:** fixed with holiday,
    early-close, DST and two-account reference/isolation checks.
19. **The provider could imply statistical significance without a statistical
    test:** fixed by explicitly rejecting that language.
20. **The next-focus prompt could force three questions when only one or two
    findings were measurable:** fixed by using the output contract's supported
    one-to-three range and prohibiting padded duplicate targets.
21. **Redistributing an unavailable lane dimension could reward missing
    evidence:** fixed by keeping fixed lane weights while reweighting only
    explicitly applicable subscore components.
22. **Cohort net P/L could be confused with the losses inside a mixed
    win/loss cohort:** fixed by separating affected count, losing count, cohort
    net P/L and losing-trade P/L in both measurements and prose validation.

## Fourth adversarial plan QA pass - 2026-08-18

The fourth pass treated the database, historical review context and provider
claim layer as hostile concurrency and semantic-boundary surfaces. It looked
for outputs that could pass reference and arithmetic validation while still
describing the wrong fact.

Additional resolved findings:

1. **Separate live reads could create a source state that never existed:**
   fixed with one account-scoped consistent SQLite read snapshot covering
   Journal, rules, notes, Analyzer revisions and issued-focus metadata.
2. **Historical weekly prose could contaminate a current monthly conclusion:**
   fixed by making the four issued reviews untrusted narrative context while
   recalculating every monthly fact and claim from exact monthly source data.
3. **Overlapping requests could call the same trades both earlier and later:**
   fixed by requiring disjoint comparison evidence or two explicit disjoint
   remainders that independently pass all gates.
4. **A cohort's money result could silently cover fewer trades than its count:**
   fixed with affected and money-eligible counts on every money measurement and
   a mandatory visible subset clause.
5. **Only trade references had a complete derivation contract:** fixed with
   typed, canonical note, measurement, claim, focus and focus-target references
   that never depend on array position.
6. **Two different facts with the same display literal could pass number-only
   validation:** fixed with semantic `claimRef` binding and server-rendered fact
   clauses that the provider cannot edit.
7. **Nonnumeric provider prose could still invent a behavior or motive:** fixed
   by removing provider-authored visible prose, using only server-owned claim
   and bridge clauses, and limiting notes to bounded attributed excerpts.
8. **`not_available` could turn insufficient evidence into an undeserved clean
   conclusion:** fixed with five distinct engine reason states and matching
   server-rendered clauses.
9. **Overlap percentages had no defined set or formula:** fixed with typed
   evidence sets, a version-one containment coefficient and separately audited
   Jaccard overlap.
10. **A merge rule implied that overlapping evidence proved causation:** fixed
    by allowing merge only for the same measured evidence while preserving the
    association boundary.
11. **Median and representative-example ties were under-specified:** fixed with
    exact even/odd median arithmetic, exact distance and non-secret structural
    tie keys.
12. **Lexical `findingRef` ties allowed an HMAC key to change rank order:** fixed
    with a semantic structural `rankTieKey` independent of scoped references,
    note prose and provider text.
13. **A previous focus could be repeated through cosmetic rewording:** fixed by
    rejecting an exact prior target and requiring changed measurable evidence
    or a genuinely narrower boundary for a carried-forward subject.
14. **The verification matrix did not falsify these boundaries:** fixed with
    hybrid-read, stale-prose, overlapping-period, partial-money, identical-
    literal, unavailable-reason and HMAC-rotation fixtures and invariants.
15. **Prompt-injection invariance was stated more broadly than the product's
    literal tag/rule semantics allow:** fixed by distinguishing harmless note
    text from a legitimate change to a tag/rule subject while still proving
    that instruction-shaped text cannot execute or bypass an evidence gate.
16. **A valid hidden focus target could still receive an unrelated visible
    question:** fixed with target-owned server-rendered `focusQuestionRef`
    choices and no provider-authored focus prose.

## Fifth adversarial plan QA pass - 2026-08-18

The fifth pass assumed every individual server-owned clause was factual, then
attacked whole-review composition, renderer boundaries, retry drift, provider
outages and the current immutable output/provenance schema.

Additional resolved findings:

1. **The provider contract repeated claim choices in both section fields and
   `sectionClaims[]`:** fixed by making one server-owned ordered section plan
   the only claim authority.
2. **Individually valid sections could form a repetitive or contradictory
   review:** fixed with global whole-review compatibility checks before the
   provider package exists.
3. **Claim and bridge order was undefined:** fixed by freezing ordered claims,
   one optional bridge and the complete rendered section in `sectionPlanRef`.
4. **Section alternatives could create a combinatorial plan explosion:** fixed
   with three plans per section, at most 81 exact combinations and a six-
   complete-plan hard bound.
5. **The provider could still construct an untested section combination:**
   fixed by reducing its result to one strict authorized `reviewPlanRef`.
6. **A default object parser could silently strip an unexpected raw-prose
   field:** fixed by requiring an exact strict selection schema with no unknown
   keys.
7. **The old free-prose output-token reservation remained unnecessarily large:**
   fixed with a 512-token ceiling for the tiny selection result.
8. **Exhausted provider retries still denied the trader a review even though a
   safe rendered default existed:** fixed with exact deterministic-default
   issuance after eligible activated-provider failures.
9. **A deterministic fallback could be mislabeled as OpenAI output:** fixed
   with truthful v3 generation-source/provider/model/receipt conditions and no
   fabricated provider attempt.
10. **The old v2 output prompt marker could not represent the insight engine:**
    fixed with new periodic/monthly v3 contracts and immutable v2/v3 dual reads
    rather than reusing or omitting the old marker.
11. **Retries after a renderer deployment could change visible wording:** fixed
    by freezing every authorized plan's complete visible output and digest in
    the request snapshot.
12. **The renderer had no contract-aligned output limits:** fixed with the exact
    current v2 narrative/focus maximums, explicit v3 coverage limits, sentence
    budgets and no mid-claim truncation.
13. **Server-owned text could still produce bad grammar or misleading signs:**
    fixed with sign, negative-zero, singular/plural, currency and partial-
    coverage rendering rules.
14. **Long labels and raw note excerpts could break limits or reintroduce unsafe
    text:** fixed with grapheme-aware label display, complete safe note excerpts
    and omission when no safe excerpt fits.
15. **A deterministic fallback could accidentally bypass product activation:**
    fixed by allowing it only for an already-activated and authorized request;
    scope, entitlement, configuration, engine, safety and stop failures remain
    fail-closed.
16. **The implementation allowlist omitted required output, administration and
    provider-control files:** fixed by adding the exact existing contracts and
    repositories needed for v3/provenance/output-token behavior.
17. **The verification plan did not test whole-plan bounds, legacy/v3 reads,
    strict schemas, renderer edge cases or truthful fallback:** fixed with
    planted, metamorphic and persisted acceptance cases for each boundary.
18. **A twelve-partial-plan beam could prune the only globally valid review:**
    fixed by exhaustively evaluating the small at-most-81 combination space
    before retaining the best six complete plans.
19. **A one-option provider call added cost and a failure point without making a
    decision:** fixed by issuing the sole safe plan deterministically after all
    normal activation, configuration and authorization gates pass.
20. **Whole-review ordering still used undefined aggregate terms:** fixed with
    exact lane-score loss, summed containment burden, component sums and
    structural tie keys.
21. **Global duplication still depended on fuzzy prose similarity:** fixed with
    semantic `factualJobKey` values and exact rendered-clause digests while
    preserving legitimate same-subject change-versus-residual comparisons.

No unresolved critical design blocker remains. Calibration values are
deliberately versioned defaults and must pass the deterministic planted and
metamorphic gates, sealed holdouts, both true-month flows and the resource
benchmark before any live provider acceptance is considered meaningful.

## Sixth adversarial plan QA pass - 2026-08-18

The sixth pass attacked operational races, very large normal-month packages,
cross-request replay, canonical byte stability, provider-selection quality and
the ability to add future finding families without degrading visible language.

Additional resolved findings:

1. **A long internal plan digest was a brittle model output:** fixed with a
   short 128-bit package key plus request-local `plan_1` through `plan_6` choice
   keys mapped privately to exact `reviewPlanRef` values.
2. **`plan_1` alone could not detect a response replayed across requests:**
   fixed by requiring the HMAC-derived `providerPackageKey` and binding it to
   the request, period, source snapshot, canonical selection payload and schema
   version.
3. **A delayed provider success and fallback could both issue:** fixed with one
   atomic pending-to-issued compare-and-set plus unique issued/accepted-audit
   constraints.
4. **A race loser could create a second notification:** fixed by allowing only
   the issuance winner to create the unique ready source event in the same
   transaction.
5. **Waiting for a late provider result or falling back could lose real cost
   facts:** fixed by separating selection authority from late usage settlement;
   real failed/late calls retain receipts but cannot replace the review.
6. **Repeated fallback execution was not explicitly idempotent:** fixed by
   returning the one already-issued row and forbidding another accepted audit or
   notification.
7. **An oversized selection package had no exact continuity rule:** fixed with
   a complete-envelope model-context preflight and deterministic-default
   issuance when the unsplit full package cannot fit or reserve.
8. **Context handling could silently omit required evidence:** fixed by freezing
   the complete local calculation source, one canonical bounded provider
   projection plus all four issued weekly reviews, and forbidding runtime
   truncation, summarization or independent selection subpackages.
9. **Section-level alternative limits still allowed a materially weaker whole
   review:** fixed with a 12-point total lane-loss cap and a required threshold-
   level overlap, focus-connection or specificity benefit.
10. **Provider variability could choose arbitrary differences without improving
    the review:** fixed by excluding every non-default plan that does not prove
    one exact compensating benefit.
11. **Byte-identical retry claims lacked a canonical serialization contract:**
    fixed with versioned fixed-order UTF-8 JSON, exact decimal/timestamp rules,
    deterministic escaping and no locale/host-line-ending dependence.
12. **A future candidate family could reach users through generic grammar:**
    fixed with an exhaustive renderer coverage registry and no generic template
    fallback.
13. **Custom titles or tags could become awkward or directive prose:** fixed by
    inserting every user label only as a quoted noun label inside an explicit
    family-specific template.
14. **A missing renderer template could be mistaken for no trader pattern:**
    fixed by keeping the candidate audit-visible and failing production snapshot
    creation as a renderer defect.
15. **Coverage limitations could be repeated across sections:** fixed with one
    review-wide `coverageJobKey` owned by `incompleteRecord` while preserving
    necessary measurement-local subset denominators.
16. **The verification plan did not prove these operational boundaries:** fixed
    with cross-request replay, just-under/over-context, provider/fallback race,
    late-usage, notification-idempotency, canonical-byte and renderer-registry
    fixtures.

No unresolved critical design blocker remains after this pass. The new whole-
plan thresholds are version-one calibration values rather than universal truths;
they must still pass the independent calculations, sealed holdouts and true-
month acceptance before activation.

## Seventh adversarial plan QA pass - 2026-08-18

The seventh pass attacked privacy expansion, frozen-provider reproducibility,
process/backup recovery, unknown external-call cost, erasure races and long-term
snapshot storage rather than candidate math or prose quality.

Additional resolved findings:

1. **`All exact-month facts` could be misread as all stored account data:** fixed
   with an exact prompt-safe field allowlist and explicit exclusions for raw
   statements, identities, Data Decisions, attachments, secrets and other
   accounts.
2. **A larger context budget could accidentally expand the data boundary:**
   fixed by rejecting every unknown nested field independently of package size.
3. **Full notes or review prose could leak through logs and support errors:**
   fixed by retaining only bounded codes, counts, versions, lengths and digests
   outside the private account-scoped snapshot.
4. **The new monthly projection/retention behavior lacked a disclosure
   checkpoint:** fixed by requiring an exact Help/Privacy comparison and a
   separate owner-approved copy slice if current language is incomplete.
5. **A retry could recompute its package key with a rotated HMAC secret:** fixed
   by validating the frozen literal and using HMAC only at request creation.
6. **The short package-key collision case was undefined:** fixed with database
   uniqueness and atomic integrity failure under a mocked collision.
7. **A deployment/settings edit could change the model, instructions or schema
   on retry:** fixed by freezing the non-secret provider/model/envelope contract
   in the insight snapshot.
8. **Provider failover could silently change the review-selection behavior:**
   fixed by prohibiting model/provider substitution for an existing request.
9. **Configuration drift and an intentional kill action were conflated:** fixed
   by allowing the default only for still-authorized operational drift while
   the existing account/platform feature controls and entitlement gate remain
   fail-closed, without inventing a second stop mechanism.
10. **A crashed process could leave an in-progress attempt stuck forever:**
    fixed with persisted, expiring, generation-fenced dispatch leases and
    bounded recovery before scheduler work.
11. **An expired or pre-restore worker could still issue a late provider
    result:** fixed by requiring the current recovery epoch, lease generation
    and token as well as the request issuance compare-and-set.
12. **The database dispatch marker and external call cannot be atomic:** fixed
    by committing `transport_may_have_started` before transport and treating a
    crash in the gap as conservative unknown exposure; the attempt is never
    resent and no receipt is invented.
13. **A crash after the committed dispatch boundary could lose cost
    protection:** fixed by retaining the attempt's maximum reservation as
    unresolved exposure without inventing an actual receipt.
14. **An unknown boundary-crossed call could be followed by another paid
    attempt:** fixed by prohibiting further provider attempts for that request
    and allowing only the frozen deterministic default after recovery.
15. **A late exact receipt could be counted in addition to that maximum:** fixed
    by replacing unresolved exposure with actual receipt cost exactly once.
16. **Actual usage over the reservation could be rejected as an integrity
    error:** fixed by recording the exact receipt, flagging the overrun and using
    actual cost to block/control later provider calls.
17. **A restored copy retained the original database's lease authority:** fixed
    by requiring the former runtime to stop, advancing a recovery epoch, fencing
    every copied lease immediately and reconciling before any attempt, fallback
    or scheduler action. Concurrent restored clones remain unsupported.
18. **Account erasure during transport could be followed by data resurrection:**
    fixed by mandatory scope/fence re-read and discard after erasure.
19. **Full source plus provider bytes could cause uncontrolled SQLite/backup
    growth:** fixed with versioned compressed large artifacts and annual
    retention/backup resource benchmarks.
20. **Compressed corruption could become valid-looking review data:** fixed with
    bounded decompression and exact canonical length/digest verification before
    parsing.
21. **The verification and ownership lists omitted these boundaries:** fixed
    with privacy/log, frozen-envelope, collision/rotation, crash/restore,
    unknown-cost, erasure and compressed-integrity fixtures plus the required
    settings/recovery source ownership.

No unresolved critical design blocker remains after this pass. Compression
settings, lease duration and recovery batch size must be chosen from the focused
resource and failure benchmarks and frozen in their respective versioned
contracts before activation.

## Eighth adversarial plan QA pass - 2026-08-18

The eighth pass attacked mixed-version deployment, destructive rollback, hidden
provider-client behavior and Railway runtime portability. The source audit used
the installed `ai@7.0.52` and `@ai-sdk/openai@4.0.30` documentation/source plus
the active v2 adapters and migration contracts; it did not call a provider or
change application code.

Additional resolved findings:

1. **The v2 request row did not identify which generation path owned it:** fixed
   with an authoritative one-way generation-contract singleton and required
   immutable request/attempt `generation_contract_version` columns distinguishing
   `openai_direct_v2` from `insight_selection_v3`.
2. **An old binary could create work after migration without understanding the
   new engine:** fixed by rebuilding those columns without insert defaults, so
   an omitted contract fails before an attempt or provider call.
3. **The proposed issued-row trigger accepted either version without binding it
   to request generation:** fixed by exact request→attempt→dispatch→output
   contract matching and crossed-family rejection.
4. **An existing v2 account/period identity could be silently upgraded:** fixed
   by returning every existing request unchanged and never adding a v3 snapshot
   or second request for the same period.
5. **Pending v2 work at activation had no safe disposition:** fixed by requiring
   zero pending/unreconciled v2 requests, attempts, reservations and receipts;
   otherwise activation aborts.
6. **A first v3 month may contain both v2 and v3 weekly reviews:** fixed with an
   explicit mixed-month contract and fixture that includes every issued week
   without inventing v2 hidden-focus metadata.
7. **Rolling or concurrent old/new writers could spend on the wrong path:** fixed
   with a single-node maintenance cutover, stopped old processes and database
   contract fences rather than a rolling deployment.
8. **A normal code rollback could make v3 reviews unreadable:** fixed with a
   recorded post-v3 compatibility floor; rollback disables generation on a v3-
   capable reader or forward-fixes, never down-migrates or restores away issued
   history.
9. **The SQLite table rebuild could lose constraints or alter immutable bytes:**
   fixed with byte/count/digest, index, trigger, foreign-key and backup
   reconciliation before activation.
10. **One persisted attempt could hide the AI SDK's default two retries:** fixed
    by explicit `maxRetries: 0` plus a one-shot fetch boundary that rejects a
    second network invocation.
11. **Structured-output repair, tools, continuation or streaming could add
    hidden calls:** fixed with a non-streaming, no-tools, no-repair, stateless
    one-call Responses manifest and captured-fetch fixture.
12. **The current adapters have no hard timeout:** fixed by freezing a calibrated
    total timeout that ends before lease recovery and cannot trigger SDK retry.
13. **A thrown post-boundary error could be treated as a free retry even when
    OpenAI processed the request:** fixed by requiring exact usage evidence or
    `usage_unknown_after_dispatch`; an unknown-cost call cannot be followed by
    another provider attempt.
14. **The installed OpenAI provider defaults generation storage to true:** fixed
    by requiring and outbound-validating `providerOptions.openai.store: false`.
15. **A future global AI SDK telemetry integration could capture full private
    inputs/outputs:** fixed by explicit per-call telemetry disablement and a
    planted integration/diagnostics-channel leakage fixture.
16. **Ambient `OPENAI_BASE_URL` could redirect the private package:** fixed by
    explicitly pinning the official OpenAI endpoint, rejecting redirects and
    disallowing activated gateway/alternate-host overrides.
17. **Calling `openai(model)` relied on the library's current default API
    family:** fixed by explicitly selecting the Responses API and freezing the
    API family/path in the invocation manifest.
18. **Reasoning effort, service tier or another provider default could change
    behavior/cost after deployment:** fixed by freezing every supported material
    option as a calibrated value or `not_applicable`.
19. **An SDK/adapter upgrade could change the final HTTP body while package
    digests still matched:** fixed with an exact outbound JSON allowlist,
    canonical invocation digest and drift-to-default behavior before network
    I/O.
20. **Removing an old manifest or compression decoder could strand immutable
    snapshots:** fixed with append-only compatibility registries while any
    unerased row references the version.
21. **The Vercel AI SDK name could be mistaken for a Vercel hosting dependency:**
    fixed by specifying direct OpenAI calls from Railway and keeping Vercel
    hosting/Gateway out of the runtime contract.
22. **Verification, failure handling and implementation ownership did not cover
    these boundaries:** fixed with cutover, old-writer, rollback, captured-
    request, hidden-retry, storage, telemetry, endpoint, timeout, SDK-drift and
    Railway-shaped fixtures plus explicit adapter/compatibility ownership.

No unresolved critical design blocker remains after this pass. The exact
reasoning/service-tier values and hard timeout remain calibration outputs, while
Railway secrets, persistent volume, single-worker process and OpenAI data
controls remain hosted activation gates rather than assumptions of local design.

## Ninth adversarial plan QA pass - 2026-08-18

The ninth pass returned to the core product question: whether correct-looking
calculations could still rank the wrong trader insight. It audited the current
v2 review facts against the Journal trade-style and Swing-note authorities, the
documented day-trade-only Analyzer boundary, and the plan's population,
financial, confidence, improvement and shortlist formulas. It did not run the
application, database, provider or test suite.

Additional resolved findings:

1. **The current AI Review trade projection has no Day/Swing identity:** fixed
   by adding the existing trader-declared style plan/revision to the consistent
   engine source and prohibiting inference from duration, route or timestamps.
2. **A ready Daily Trade Analyzer row could be applied to a Swing, while
   requiring style on every row would discard valid unclassified history:**
   fixed by requiring current ready evidence, objective same-market-date timing
   and no contradictory declared Swing/other style, without inventing intent for
   an unknown historical style.
3. **Dated Swing notes were outside the claimed all-notes review context:**
   fixed with identity-linked, revisioned Swing-note/next-session-plan context
   for in-period notes on included closed trades under the same non-scoring
   untrusted-text boundary as other notes; open/out-of-period notes stay out.
4. **A trade closing this month could make a prior-month entry look like a
   current-month execution:** fixed with separate close-result, execution-event,
   rule, note and focus temporal ownership plus explicit renderer labels.
5. **`Affected observation` could mean trades, events, days or rule reviews in
   different parts of one score:** fixed with a closed observation-unit enum,
   exact unique member sets and numerator-subset/source-reconciliation gates.
6. **Gross losing-trade share could make a net-profitable broken-rule cohort
   rank as the largest financial drag:** fixed by scoring behavioral friction
   from adverse cohort net contribution while retaining gross loss composition
   as supporting context and contrast evidence.
7. **The mirror error could praise a cohort whose winners were outweighed by
   losses:** fixed with beneficial cohort net contribution for positive
   behavioral ranking; gross profit share remains primary only for explicit
   winner-concentration/outlier families.
8. **Selective partial P/L could create an extreme money score:** fixed by
   making partial covered-subset money display-only in version one unless the
   complete numerator and comparable period denominator are available.
9. **Sample confidence could use the 420-trade remainder instead of a five-
   trade affected cohort:** fixed by using the weakest declared affected,
   comparison, early/later and opportunity population.
10. **Outlier resistance had no reproducible effect/removal formula:** fixed
    with a family-declared signed effect and the worst leave-one-primary-member/
    leave-one-independent-bucket direction-preserving retention.
11. **A changing trade mix could create a Simpson's-paradox improvement:** fixed
    with pre-result structural strata, pooled-weight standardization and exact
    mixed/confidence/unavailable outcomes for direction or magnitude distortion.
12. **A corrected/excluded/relinked source could leave an earlier focus baseline
    factually stale:** fixed with source-lineage checks and only a complete,
    explicitly revised canonical baseline path; issued prose remains immutable.
13. **The top three alternatives could all be labels for the same trades:**
    fixed with evidence-cluster/action-target caps and a precise exception only
    when no distinct candidate is within 10 score and five confidence points.
14. **A weak calculable candidate could be promoted merely to fill a section:**
    fixed with a visible 50-confidence/actionability/family gate and explicit
    narrow example/outlier or no-pattern forms when no recurring finding passes.
15. **The plan said exploratory gates should get stricter without defining how:**
    fixed with the exact 1-5, 6-10, 11-25 and 26-plus sibling schedules for
    cohort, comparison, spread and largest-contributor requirements, plus the
    new mixed-style/temporal/net-P/L/partial-money/mix-shift/baseline/diversity
    fixtures and bounded batch-read ownership needed to prove them.
16. **Bulk event-level Analyzer context could bury the durable pattern in
    hundreds of one-minute/five-minute observations:** fixed by keeping the full
    Analyzer record in the immutable local calculation source, calculating
    long-term aggregates before provider packaging and projecting only exact
    aggregate/coverage series plus at most eight unique whole-package excerpts
    and two for any candidate. RSI 14 and other technical context cannot become
    a period finding from one event.
17. **RSI 14 was present but not trustworthy enough to rank:** fixed by gating
    every unversioned RSI out of candidates/provider excerpts and requiring an
    immutable calculation version with exact Wilder initialization/zero
    behavior, golden vectors and new-revision-only persistence before RSI
    findings can activate.
18. **Event-level RSI could count one actively managed trade several times:**
    fixed by limiting version one to one initial-entry and one final-exit
    observation per trade, separating role/direction, comparing with the exact
    eligible remainder and counting every tested band as a multiplicity sibling.

No unresolved critical design blocker remains after this pass. The accepted
version-one behavior now depends on the exact observation-unit, style,
temporal, net-contribution, partial-money, confidence and sensitivity fixtures
passing together; a smooth provider-selected review cannot compensate for a
failed deterministic population or rank.

## Tenth adversarial plan QA pass - 2026-08-18

The tenth pass attacked the remaining product failure mode: a review whose
arithmetic is valid but whose denominator, coverage, scale, timing or emphasis
makes the conclusion misleading to a trader. It reviewed the complete engine
design and acceptance contracts only; it did not run the application, database,
provider or test suite.

Additional resolved findings:

1. **All Analyzer rates could use the full covered population even when only a
   few trades reached the decision point:** fixed with frozen opportunity
   populations plus separate period-prevalence and conditional rates.
2. **Five green-to-red failures could read as 5% of 100 instead of 5 of the 6
   trades that ever moved green:** fixed with exact state-machine denominators
   that cannot be selected after results are known.
3. **Sixty-percent coverage could still mean Analyzer evidence exists almost
   only for winners or early weeks:** fixed with fixed-stratum readiness balance,
   lowest-material-stratum confidence and subset-only language under skew.
4. **Rule reviews completed mainly after losses could make broken rules look
   more outcome-linked than they are:** fixed by applying the same optional-
   evidence balance gate to reviewed versus not-reviewed opportunities.
5. **A trivial loss could receive a perfect money score merely because it was
   100% of a tiny loss pool:** fixed with a harmonic scale guard combining the
   polarity/path-pool share and share of total absolute period P/L.
6. **Large losses inside a broken-rule cohort could rank as the main financial
   drag even when followed-rule trades did equally poorly:** fixed with frozen
   comparable populations, a descriptive consequence verdict and reduced/zero
   money rank when worse associated outcomes are not established.
7. **An early-versus-later average could call the month improved after the
   latest sufficiently populated week gave most of the gain back:** fixed with
   an exact improved-then-recently-regressed verdict and a separate sparse-
   partial-week boundary.
8. **A mixed finding could cite only its supporting trades:** fixed with
   purpose-specific representative roles and required supporting plus
   contradicting/remainder evidence in visible plans and bounded excerpts.
9. **The four required weekly reviews could sway the model to a different main
   monthly conclusion even though their prose is not factual authority:** fixed
   with one deterministic decision-critical spine shared by every provider-
   selectable plan.
10. **The opening still had enough freedom to become generic or repeat later
    cards:** fixed with result-first sentence order and one eligible strength,
    contrast, concentration or outcome-only emphasis.
11. **A consequence-free repeated process count could narrowly displace a
    materially grounded held-back finding:** fixed with the bounded measured-
    consequence guard inside the friction default.
12. **Next-period questions were traceable but not required to act on the main
    held-back finding:** fixed with held-back-first focus ordering, explicit
    observable opportunities and a ban on generic `review your exits` forms.
13. **The validators and fixtures did not prove these product distinctions:**
    fixed with opportunity-denominator, selective-coverage, tiny-pool,
    non-separated-cohort, late-reversal, balanced-example, immutable-spine,
    opening and focus-priority acceptance cases and metamorphic checks.

No unresolved critical design blocker remains after this pass. Version-one
calibration must still determine whether the provisional 10-point consequence,
15/20-point association and 10/20-point recency thresholds produce the intended
ordering on the sealed holdouts; changing them after calibration requires a new
engine version and resealed holdout rather than a fixture-specific exception.

## Eleventh adversarial plan QA pass - 2026-08-18

The eleventh pass attacked source semantics and comparison fairness after the
tenth pass's denominator/scale corrections. It checked the proposed engine
against the current rule lifecycle/evaluator contracts, the reduced v2 rule
projection, sparse review coverage, mixed cohort composition, repeated focus
assessment and the closed-trade-only result boundary. It did not run the
application, database, provider or test suite.

Additional resolved findings:

1. **The plan treated every recorded rule row as an opportunity without proving
   the rule was active:** fixed by joining effective and active/paused/retired
   intervals and excluding non-active targets rather than calling them not-
   reviewed.
2. **The v2 AI Review input drops preset trigger/violation evidence:** fixed by
   joining the existing same-version evaluator evidence before projection.
3. **A threshold-reaching trade could be named as the rule break even when only
   a later trade violated it:** fixed by allowing execution-specific wording
   only from an exact `violation` event; status-only custom rules remain status-
   only.
4. **Lifecycle/identity disagreement could corrupt a rule denominator, while an
   evaluator disagreement could overwrite the trader's status:** fixed with
   target-level unavailability for identity defects and status-only language/
   lower source consistency—without recategorization—for evaluator conflict;
   unrelated findings continue under the ordinary review.
5. **Profitable trades with no recorded break could be praised despite most
   applicable rules being unreviewed:** fixed by making absence of a break
   ineligible as strength and requiring one exact followed-rule subject or a
   complete followed multi-rule set.
6. **Broken-versus-followed cohorts could differ mainly because one side was
   Day trades, shorts or a different week:** fixed with pre-result structural-
   stratum standardization before any financial consequence verdict.
7. **A worse loss rate but better median P/L could be cherry-picked as whichever
   story ranked higher:** fixed with a mixed verdict when the two available
   consequence branches materially disagree.
8. **Different position/risk scale could make raw dollar medians look like
   execution-quality separation:** fixed by disabling the dollar branch across
   the provisional 0.5-2 median-absolute-P/L scale boundary when exact risk/
   notional/size facts are unavailable.
9. **One high-volume final day could satisfy the observation count and reverse a
   monthly trend:** fixed by requiring at least two independent market dates/
   days for latest-state reversal; the one-day result remains an outlier.
10. **Free-text context became unable to qualify a main conclusion after the
    deterministic spine was frozen:** fixed with an objective context-qualified
    clause and exact safe attributed excerpt that cannot alter status/rank or
    infer motive.
11. **The oldest focus could win every later review by accumulating the longest
    evidence span:** fixed by freezing prior assessment members, rejecting
    unchanged reuse and preferring an unassessed focus within 10 points unless a
    material new-evidence repeat exception applies.
12. **A historical rule could create a next-period question after it was paused
    or retired:** fixed with source-snapshot-time future trackability and no
    implied recommendation to reactivate it.
13. **A profitable closed-trade month could read as the whole account result
    while positions remained open:** fixed with closed-trade wording, exact
    period-end open-position count and an explicit no-unrealized-P/L boundary.
14. **Validation, fixtures and implementation ownership did not prove these
    distinctions:** fixed with active-interval, trigger-versus-violation, sparse-
    strength, composition/conflict/exposure, one-day recency, context, focus-
    novelty and open-position cases plus the required bounded Journal reads.

No unresolved critical design blocker remains after this pass. The 15-point
outcome separation, 20% median, 0.5-2 exposure-scale and within-10-point focus
preference are provisional version-one calibration values. They must pass the
sealed holdouts together; any post-calibration change creates a new engine
version rather than a fixture-specific exception.

## Twelfth adversarial plan QA pass - 2026-08-18

This documentation-only pass challenged the engine against missing-but-
applicable rule evidence, the current evaluator's overloaded `n/a` result,
late-day rule violations, open lifecycles with position reductions, sparse
periods, small-denominator language and ranking certainty. It inspected the
current preset evaluator contract and planned data ownership but did not run or
change the application, database, provider, runtime or test suite.

Additional resolved findings:

1. **An absent rule-result row could be silently treated as an explicit not-
   reviewed status:** fixed with mutually exclusive followed, broken, explicit-
   not-reviewed and expected-missing states for proven active applicable
   opportunities.
2. **The evaluator's `n/a` could mean either no applicable trade or missing
   facts, while only free-text limitation described why:** fixed by requiring a
   backward-compatible typed reason and mapping unknown/untyped cases to
   evaluation-unavailable rather than parsing prose.
3. **Reviewed adherence, completion coverage, recorded-disposition coverage and
   broken prevalence could reuse the wrong denominator:** fixed with four
   separate frozen member sets and renderer labels.
4. **A low-review-coverage rule could show a dramatic reviewed-only rate as a
   period-wide fact:** fixed by attaching reviewed and expected-applicable counts
   and barring sparse reviewed subsets from clean-process/period-wide language.
5. **All trades on a broken-rule day could be presented as the financial impact
   even when the violation occurred late:** fixed by making full-day P/L outcome
   context only and allowing money rank solely from a same-version typed
   violation-member set.
6. **A trigger or simple timestamp could be used to invent which later trades
   were affected:** fixed by accepting only preset-declared violation members;
   status-only rules retain process/repetition evidence without financial-
   consequence wording.
7. **A still-open trade with a position reduction could be partly counted now
   and fully counted again after closure:** fixed by keeping the entire open
   lifecycle outside closed-trade P/L, disclosing only exact open/reduced counts
   and freezing them at the source snapshot.
8. **An open-position count could sound like account exposure:** fixed by
   prohibiting quantity, risk, unrealized-value or materiality inference and
   giving the boundary no rank.
9. **A percentage such as 67% could overstate a two-of-three observation:**
   fixed by requiring the exact count/denominator beside every rate and leading
   with counts below 20 opportunities.
10. **A deterministic winner could be called the main problem despite a near
    tie or leave-one-week rank reversal:** fixed with dominant/near-tie/only-
    eligible rank certainty and superlatives reserved for a stable five-point
    separation.
11. **A sole calculable candidate could be mistaken for a uniquely important
    behavior:** fixed by separating `only_eligible` from `dominant` and keeping
    the provider unable to upgrade certainty.
12. **An upstream-eligible no-trade or two-trade period could manufacture a
    recurring lesson from reflections or recordkeeping:** fixed with exact
    unavailable/example boundaries and unchanged family recurrence gates.
13. **Validation and fixtures did not prove these boundaries:** fixed with new
    rule-state, late-violation, open-reduction, rank-separation, sparse-period,
    small-denominator and metamorphic cases.
14. **The implementation allowlist omitted the sources needed to add typed
    evaluator availability and reconstruct historical open-lifecycle
    reductions:** fixed by explicitly adding the evaluator/test and bounded
    execution repository read, without changing Journal facts or rule meaning.
15. **Missing custom-rule reviews could not be classified safely because custom
    rules do not use preset evaluator applicability:** fixed by reusing the exact
    historical Trade Tracker day/trade projection, keeping `both` scopes
    separate and forbidding a missing row from creating its own opportunity.
16. **An exact preset evaluator result with no saved trader disposition could be
    either lost or incorrectly counted as a completed review:** fixed with an
    orthogonal evaluator state/rate, attributed evaluator-only findings and
    same-rule clustering; a saved conflict still forces status-only handling.

No unresolved critical design blocker remains after this pass. The new five-
point rank-separation boundary joins the existing provisional calibration
values and must pass the same sealed holdouts before activation. The main
remaining uncertainty is empirical calibration and trader usefulness, not an
undefined data or attribution contract.

## Completion boundary

This redesign is complete only when:

- each request is calculated from one consistent account-scoped source
  snapshot rather than a hybrid of concurrent Journal revisions;
- the snapshot includes identity-linked current trade-style and dated Swing-
  note revisions, keeps all closed trades in results and separates declared-
  style populations from objective same-market-date Daily Trade Analyzer
  eligibility without inventing intent;
- every candidate fixes one observation unit, unique population membership and
  result/event/note/focus temporal ownership before any measurement or score;
- every conditional behavior fixes its observable opportunity population,
  retains separate period prevalence and cannot borrow whichever denominator
  produces the larger percentage;
- every rule opportunity reconciles to the exact active lifecycle/version, and
  only identity-linked preset violation evidence can name a violating execution;
- rule normalization keeps explicit not-reviewed, expected-missing, typed not-
  applicable and evaluation-unavailable states distinct, and every adherence/
  coverage measure uses its declared denominator;
- preset evaluation remains an orthogonal attributed evidence axis, never
  raises review completion and never duplicates the same rule/target finding;
- custom rule opportunities reproduce the exact historical Trade Tracker
  projection and keep day/trade units separate;
- optional Analyzer/rule evidence passes fixed-stratum coverage-balance checks
  before it can support period-wide or financial-headline language;
- request, attempt, dispatch and output share one immutable generation contract;
  its singleton advances only after zero pending v2 work and no mixed old/new
  writer, then prevents destructive rollback below the first v3 row;
- every provider field is explicitly allowlisted and private/internal/cross-
  account data cannot enter packages, logs, Admin or support output;
- every eligible Analyzer record participates in local calculation, while bulk
  raw one-minute/five-minute observations stay out of provider context and only
  exact long-term aggregates plus selected representative excerpts enter it;
- unversioned RSI is excluded and the RSI family remains unavailable until
  corrected calculation-version values pass the reference verifier and normal
  population gates;
- deterministic planted findings, independent score calculations and sealed
  holdouts rank correctly before provider involvement;
- the monthly provider package contains the four actually issued weekly
  reviews, every permitted non-Analyzer field and the complete bounded Analyzer
  projection, while historical prose cannot change a current monthly
  measurement, claim or decision-critical conclusion;
- every available visible section identifies a useful finding and does not
  duplicate another section's explanatory job;
- clean-process strengths require positive rule evidence rather than absence of
  recorded breaks or missing/not-reviewed applicable rules;
- every authorized whole-review plan passes global compatibility and renderer
  limits before the provider can select it;
- `What improved` uses a real comparison or the exact engine-authorized no-
  comparison fallback;
- `What held you back` identifies measurable affected behavior and impact;
- financial wording preserves result/path/association boundaries and never
  presents overlapping cohort P/L as caused or additive loss;
- whole-day rule P/L remains context-only; a day-rule financial association
  requires the preset evaluator's exact bounded violation members and excludes
  every earlier/unaffected trade;
- behavioral money rank uses adverse/beneficial complete cohort net contribution
  rather than cherry-picked losing/winning members, and partial covered-subset
  money contributes no version-one score;
- money rank is guarded by both polarity/path-pool share and total period
  magnitude, and behavioral financial emphasis reflects its declared comparable
  consequence verdict rather than affected-cohort dollars alone;
- consequence comparisons survive fixed structural-mix standardization, reject
  material rate/median conflict and never claim size/risk normalization from raw
  dollar differences when exposure facts are unavailable;
- every earlier/later comparison uses disjoint evidence and every partial-money
  claim states its exact covered subset;
- every material composition shift passes the fixed-stratum standardized
  sensitivity, confidence uses its weakest required population and outlier
  resistance reproduces the declared leave-one-unit/bucket result;
- visible certainty reflects exact rank separation and sensitivity, so a near
  tie or sole eligible candidate cannot be called the exclusive main finding;
- improvement exposes a materially adverse latest-sufficient-bucket reversal
  without allowing a sparse or one-market-date partial week to manufacture the
  verdict;
- follow-through connects an issued focus only to evidence occurring after its
  actual issuance boundary and never compares a superseded baseline unless a
  complete canonical revised baseline is explicitly available;
- follow-through records prior assessment members, requires new independent
  evidence before reassessment and does not let the oldest unchanged focus crowd
  out a comparable unassessed one;
- an available genuine strength is recognized;
- visible candidates pass the family/confidence/actionability floor and the
  alternatives retain distinct evidence/action targets when the exact diversity
  exception does not apply;
- mixed/comparison findings expose both supporting and contradicting/remainder
  representative roles when available;
- affected trader notes qualify the objective selected clause without changing
  measurements/status or becoming an inferred excuse, motive or discipline
  judgment;
- the provider must echo the current short `providerPackageKey` and can select
  only one request-local `providerChoiceKey`, which the server resolves to one
  frozen whole `reviewPlanRef`, while every section, semantic claim, focus
  target and rendered byte derives from it;
- exhausted or blocked provider selection issues the exact safe deterministic
  default without false provider/model/receipt provenance, while engine or
  safety defects still fail closed;
- provider success/fallback races produce exactly one issued review, accepted
  audit and ready notification, while any real late-call usage remains billed
  to that attempt without replacing the output;
- complete provider packages are frozen and preflighted without truncating,
  summarizing or splitting any field required by the bounded projection;
- retries preserve the exact pinned provider/model/instruction/schema envelope
  with no silent model failover, while account/platform disable and entitlement
  revocation still prevent deterministic issuance;
- the final outbound call is one audited non-streaming OpenAI Responses POST to
  the approved endpoint with `maxRetries: 0`, bounded timeout, `store: false`,
  telemetry disabled and no hidden tools/repair/continuation;
- ambient environment variables, redirects, SDK/provider upgrades and default
  changes cannot alter the frozen invocation manifest or leak the private body;
- the host-neutral Node adapter runs directly on Railway without requiring
  Vercel hosting or Gateway, while Railway/OpenAI hosted gates remain inactive
  until separately verified;
- crash and backup recovery require one authoritative runtime, advance a
  recovery epoch, fence every abandoned or pre-restore worker, do not make
  another provider attempt after unknown transport, distinguish pre-boundary
  attempts from boundary-crossed calls with unknown usage and never double-
  count actual versus unresolved maximum cost;
- exact provider usage is retained even when it exceeds reservation, with the
  overrun controlling later spend rather than being clipped or discarded;
- in-flight results cannot survive account erasure or recreate scoped data;
- every compressed snapshot artifact reproduces its canonical bytes before use
  and meets the accepted peak-memory, database-growth and backup-size bounds;
- every activatable finding/section/attribution/coverage combination has an
  explicit safe renderer template and no generic prose fallback;
- every visible rate includes its count and denominator, with small samples led
  by counts rather than an isolated percentage;
- existing v2 and both v3 generation sources reopen through one customer read
  path without changing old output;
- every provider-selectable monthly plan and repeated live selection retains the
  same decision-critical spine;
- the opening reports period activity/result first and the first next-period
  question targets the selected actionable held-back issue when one exists;
- the opening explicitly reports closed-trade P/L, the coverage boundary states
  the exact count of confirmed period-end open positions and those with in-
  period reductions without partial/unrealized P/L or exposure inference, and
  rule-bound future questions require the rule to remain trackable;
- the saved review reopens through the normal customer read path;
- the owner judges the resulting review materially useful to a trader.
