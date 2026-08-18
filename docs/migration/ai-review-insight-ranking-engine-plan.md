# AI Review Insight Ranking Engine Plan

## Status

Design and seven implementation-readiness QA passes complete under the owner's
delegated product authority on 2026-08-18. Implementation has not started. The
owner does not need to approve individual formulas or weight calculations, but
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

- What happened financially during the period?
- What behavior or result improved?
- What specific pattern most held the trader back?
- What happened after an earlier review asked the trader to examine something?

When the evidence exists, the review should identify affected trade counts,
associated P/L, share of losses or profits, weekly change and representative
trades. It should also recognize a strong execution or repeatable strength.
The review is not complete merely because all four visible sections contain
grammatical prose.

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
- trading dates and exact review periods;
- named trade and day rule outcomes;
- tags;
- saved daily and trade notes;
- compact Trade Tracker Analyzer event and path evidence;
- coverage limitations;
- prior issued reviews and their next-period focuses.

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

The current AI Review input has trader-authored daily and trade notes but no
separate structured saved-trade-plan object. A candidate may discuss alignment
with a plan only when a named rule or the trader's own note supplies that plan
evidence. The engine must not turn a tag or generic Analyzer observation into a
claim that a saved plan was followed.

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

Trader-authored notes, custom rule titles and tags are untrusted evidence data,
not provider instructions. The serializer places them in clearly delimited
fields and tells the provider not to follow commands found inside them. Text
such as `ignore the review instructions` cannot change candidate generation,
lane ranks, allowed selection references or server validation.

### Provider projection privacy allowlist

`Every permitted exact-month fact` means every field in the versioned AI Review
provider allowlist, not every row or object held by TraderLink. The prompt-safe
projection may contain the accepted review-period trade facts, dated rule
outcomes, tags, saved note/reflection text, compact Analyzer evidence, coverage
state and same-account issued-review context already authorized by this plan.
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
loads the exact-period Journal facts, rule definitions and outcomes, note
revisions, Analyzer evidence, coverage state, issued-review metadata and
accepted hidden focus metadata, and then copies the normalized immutable source
before closing the transaction. It cannot perform a sequence of unrelated live
reads that could combine an old note with a new rule result or a revised
Analyzer record.

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
- whether the rule was saved as a focus.

These fields let the engine distinguish a preset risk rule from an unrelated
custom review rule and detect a rule definition that changed mid-period.
Private rule IDs and versions never enter the provider package.

The current v2 provider shapes intentionally omit stable trade/rule identities
and reduce saved trade notes to ticker plus text. Before that projection, the
snapshot builder needs an engine-only transient evidence manifest containing
the exact round-trip/version, rule/version, review target and note revision
links. It converts private identities to prompt-safe references, attaches each
trade note and rule-review note to that exact reference, and then discards the
private IDs from the normalized calculation source. The engine must never join
a note to a trade by ticker, date or array position.

If a rule changes materially during a month, trend calculations split at the
version boundary. The engine must not claim improvement across two different
thresholds or statements merely because they share a stable rule identity.

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
  metric and unit, population/comparison definition, exact value, numerator,
  denominator, availability, coverage and attribution kind;
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
- trades and days by rule subject and rule version;
- trades by exact tag, ticker, session and historical direction;
- trades by fixed Eastern entry-time, holding-duration and weekday buckets;
- trades by Analyzer availability and green-to-red state;
- trades by presence of entry, add, partial-exit and final-exit events;
- issued focuses by source review and source-period end date;
- eligible later evidence dates for each issued focus;
- exact positive, negative and flat P/L populations;
- exact Analyzer-covered populations for every Analyzer-derived rate.

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

### Monthly calculation before canonical provider packaging

The current monthly snapshot removes raw Analyzer detail from dates already
represented by an issued weekly review before serializing the provider package.
That old token-saving boundary does not apply to the insight engine or its new
provider-selection package.

Monthly candidate calculation must run while the local snapshot builder still
has the complete exact-month weekly snapshots and their Analyzer evidence. It
then freezes the derived candidate brief, measurements, representative compact
evidence and source digests into the immutable monthly request. The provider
serializer then emits one canonical copy of the permitted exact-month source
rather than inheriting the old omission behavior.

This preserves all-month Analyzer facts without sending the same raw evidence
twice. A provider retry uses the frozen brief and canonical factual projection;
it never reopens later Journal state or recalculates against edited evidence.
Weekly inputs remain an immutable audit source, while the monthly factual
projection—not weekly prose—supplies the exact-month Analyzer record.

The monthly provider package contains the four actually issued weekly reviews
and one canonical copy of every permitted exact-month fact: trades, rule
outcomes, tags, daily/trade/rule notes and reflections, Analyzer evidence and
coverage state. It may avoid sending the same exact source record twice merely
because that record also appeared in a weekly input, but it cannot omit,
summarize, truncate or replace an exact-month fact with weekly prose. Prior
weekly prose may help the provider understand what was previously communicated,
but no monthly `claimRef` may cite that prose as its factual source. Replacing a
weekly review's visible text with stale numbers, generic boilerplate or prompt-
like instructions while leaving the exact monthly facts unchanged must not
change monthly candidates, measurements, scores, selection options or server-
rendered fact clauses.

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
laneEligibility[]
cohortDefinition
comparisonDefinition
measurements[]
weekSeries[]
representativeTradeRefs[]
relatedRuleRefs[]
relatedFocusRefs[]
overlapKeys[]
coverage
scores
adjustments[]
penalties[]
rankExplanation[]
```

Each measurement contains its `measurementRef`, stable metric name, exact value,
unit, numerator, denominator, affected count, applicable coverage counts,
availability state, attribution kind and server-generated `displayLiteral`.
Money measurements also contain a money-eligible count. The literal uses
the accepted currency/percentage/count formatter and never guesses a currency
symbol when the period currency is unavailable. When money coverage is partial,
the literal states the covered subset, for example `among the 4 of 6 affected
trades with complete P/L`. The provider cannot silently apply that money result
to all six trades because only the server-owned covered-subset claim is
selectable. Provider output is never used as a measurement.

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
- result excluding the largest winner or loser.

This family supplies the opening result but is not by itself evidence of good
or bad process.

### 2. Named rule association

For every unchanged named rule and valid scope:

- followed, broken and not-reviewed counts;
- followed and broken rates among reviewed outcomes;
- affected trade or day count;
- P/L for trades or days where the rule was followed;
- P/L for trades or days where the rule was broken;
- total losing-trade P/L inside the broken cohort;
- broken-cohort share of the period's total losing-trade P/L;
- total winning-trade P/L inside the broken cohort;
- week-by-week counts, rates and associated P/L;
- up to three representative affected trades or days.

Day-rule P/L uses the exact day's included closed-trade P/L. Trade-rule P/L
uses only the affected trade. Day and trade findings remain separate and are
never added together.

A trade can appear in several rule cohorts. Overlapping loss shares are never
summed as if they were independent damage.

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
- rates using Analyzer-covered trades as the denominator;
- combined final P/L by state;
- combined measured peak P/L;
- combined peak-to-final reversal;
- combined peak-to-red reversal;
- trades and counts involving adds after the peak;
- trades and counts involving a partial exit before turning red;
- best-profit-opportunity counts and measured windows;
- weekly count, rate, P/L and reversal series;
- representative high-impact and representative typical trades.

The engine separately identifies:

- profitable trades with large measured giveback;
- trades that moved green and ended red;
- trades that recovered after turning red;
- trades that protected most of their measured favorable result;
- improving or worsening giveback rates across weeks.

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

The engine must not combine one-minute and five-minute observations into an
invented signal or infer a strategy edge from a small sample.

Analyzer favorable/adverse movement and post-exit path decimals are price
movement, not trade P/L. They can support a representative trade but cannot be
summed across tickers or ranked as financial impact. Cross-trade percentage
claims require an accepted percentage field with an explicit denominator; the
engine will not manufacture a percentage from fields that lack one.

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

### 12. Positive process and repeatable strengths

Search deliberately for:

- profitable trades with no broken reviewed trade rules;
- losses where all reviewed process rules were followed;
- trades that followed entry, risk and exit rules together;
- controlled favorable-move giveback;
- effective stop response;
- clean, supported adds;
- strong entry examples;
- improved behavior sustained across later weeks;
- profitable cohorts whose result is not dependent on one outlier.

The engine distinguishes a repeatable strength from a single example. A losing
trade may support positive process when its rules and execution evidence do.

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
- whether the focus concerns reduction, consistency, examination or strength
  repetition.

The visible focus remains ordinary prose. The tracking metadata is stored with
the immutable issued review and is not shown as system language.

For existing reviews without tracking metadata, the engine may build a lower-
confidence candidate by matching the focus against exact named rules, tags and
candidate families. It cannot manufacture a match from general word overlap.

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

## Evidence gates

### General pattern gate

A recurring pattern uses the cadence's independent spread axis:

- a weekly review uses separate market dates;
- a two-week or monthly review uses separate calendar-week buckets.

It normally requires either at least three affected observations across two
independent spread buckets, or at least two affected observations across
separate buckets plus a material financial contribution. This allows a weekly
review to identify repetition across trading days without pretending that
multiple trades on one day establish a period-wide habit.

A single observation can qualify only as an explicit material outlier or a
specific execution example.

### Rule gate

- At least three reviewed outcomes are required for a rule rate.
- `not_reviewed` is excluded from followed/broken rate denominators and remains
  visible as coverage.
- A recurring broken-rule finding normally requires at least two breaks.
- One break may qualify as a material outlier when its loss represents at least
  10% of the period's total losing-trade P/L.
- Rule improvement follows the cadence-specific improvement gate below rather
  than requiring three current-period week buckets for every cadence.

### Segment gate

A ticker, tag, session, direction or time segment normally requires:

- at least five trades; or
- at least three trades spread across two cadence-appropriate independent
  buckets;
- at least five eligible trades in the comparison population;
- no single trade contributing more than 70% of the segment's absolute P/L,
  unless the finding is explicitly classified as outlier-dependent.

### Analyzer gate

- Analyzer-derived rates use ready Analyzer trades only.
- At least three covered trades are required for a rate.
- Period-wide Analyzer language requires at least 60% trade coverage.
- Below 60%, the finding must state the exact covered population and cannot be
  described as representative of all trades.
- Monetary peak/giveback aggregation requires `feesComplete = true` for every
  included Analyzer path. A path with incomplete fees remains eligible for
  count/status observations but not pooled peak, reversal or final-P/L money.
- Price-move decimals from entry and post-exit paths remain per-trade evidence
  and never enter pooled money or percentage calculations.

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

Activity weighting does not by itself make changing denominators comparable.
For rule rates, each side records reviewed, not-reviewed and applicable counts.
For Analyzer rates, each side records ready and total eligible trades. A
version-one shift of more than 15 percentage points in review/Analyzer coverage
forces a mixed or unavailable comparison unless a fixed common eligible cohort
can be calculated. If the affected rate improves while the affected count or
financial/path effect materially worsens, the candidate is mixed rather than
an unqualified improvement.

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

## Exact measurements

All divisions expose the exact numerator and denominator and use the accepted
exact-decimal math utilities. Display rounding never changes ranking inputs.

Key definitions:

- **Total losing-trade P/L:** absolute sum of all negative included net trade
  P/L. This is a performance population, not the trade's unavailable broker
  gross-P/L field.
- **Total winning-trade P/L:** sum of all positive included net trade P/L.
- **Win rate:** positive-P/L trades divided by every included trade with a
  non-null P/L, including flat trades in the denominator, matching the current
  v2 input calculation.
- **Loss share:** absolute negative P/L inside a cohort divided by the period's
  total losing-trade P/L.
- **Profit share:** positive P/L inside a cohort divided by the period's total
  winning-trade P/L.
- **Broken rate:** broken divided by followed plus broken.
- **Affected rate:** affected eligible observations divided by the candidate's
  exact eligible population.
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

Every money measurement records both the full affected population and the
money-eligible subset. A section can say that a pattern appeared on six trades
and that the four with complete P/L lost a stated amount; it cannot describe the
amount as the result of all six. The opening similarly distinguishes completed
trade count from P/L-eligible trade count whenever they differ. A partial money
population may contribute only under its declared coverage/confidence rules and
never supplies an unstated full-population denominator. Net P/L is labeled as
the period total only when every included trade is money-eligible; otherwise it
is explicitly the known P/L among the covered subset.

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

Analyzer peak-to-final P/L can be described as measured giveback between the
recorded peak and final result. It is not guaranteed executable profit and must
not be called money the trader could certainly have captured. The provider
brief labels every financial measurement as period result, cohort association
or Analyzer path measurement, and server validation rejects incompatible
causal/counterfactual wording.

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

For negative candidates, the main component is cohort loss share. For positive
candidates, it is cohort profit share or protected measured profit. Giveback
candidates use measured reversal relative to the Analyzer-covered peak-profit
population. Exact dollars remain an important displayed measurement, but there
is no universal absolute-dollar scoring threshold across account sizes. A
money score is relative to the comparable period population; recurrence,
coverage and specificity determine whether a small low-activity result is a
period-wide finding or only an example.

The component is unavailable, not fabricated as zero, when comparable money is
unavailable. Other dimensions remain eligible, but the missing financial weight
does not redistribute and inflate the lane score.

The version-one score is the declared comparable share multiplied by 100:
loss share for a negative result, profit share for a positive result, measured
reversal divided by total positive Analyzer-covered peak P/L for giveback, or
retained favorable P/L divided by the same covered peak population for path
protection. The raw share remains visible and the score is clamped under the
common rule. A candidate cannot choose whichever denominator produces the
largest score; its family fixes the denominator in `engineVersion`.

### Repetition

The default repetition score combines:

- 45% affected rate;
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
  family's expected eligible population;
- 25% sample sufficiency: `min(100, 50 * eligible count / family minimum)`, so
  a just-passing population receives 50 and twice the minimum receives 100;
- 20% cadence-appropriate independent spread;
- 15% outlier resistance: the share of the candidate effect that remains after
  removing its largest absolute contributor; and
- 10% structured-source consistency when the family expects two independent
  structured sources.

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
- strength `outcome support` is positive profit share or measured favorable-
  path retention. It is unavailable, rather than zero, for a rule-followed
  losing-trade strength because planned risk is not an accepted input;
- `cross-period consistency` is supporting independent buckets divided by
  eligible independent buckets;
- `result/process divergence` is the smaller of the result-polarity score and
  process-polarity score, ensuring both sides of a contrast are material. The
  result side uses financial materiality when available, otherwise the exact
  win/loss outcome rate; the process side uses the applicable followed/broken
  rule rate or structured Analyzer behavior rate;
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

The version-one exploratory multiplicity schedule is 0 points for at most five
eligible sibling groups, 5 points for 6-10 groups, 10 points for 11-25 groups
and 15 points for more than 25 groups. It applies only to ticker, tag, weekday,
time and duration cohort candidates. The version-one unresolved-overlap
schedule is 0 points below 35% evidence overlap, 5 points at 35-49%, 10 points
at 50-64% and 15 points at 65% or more when two cross-family candidates cannot
be merged without losing a materially distinct finding. The stronger candidate
keeps its score; the lower-ranked duplicate receives the subtraction.

Exploratory cohort families must record the number of eligible sibling groups
tested. Their minimum sample, independent-spread and outlier-resistance requirements
increase as sibling-group count increases. The engine does not claim a stable
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

Representative examples are selected for both impact and typicality:

1. highest material contribution;
2. closest-to-median affected example;
3. most recent independent example.

This prevents every section from citing only the largest loser.

The candidate declares the exact representative metric before examples are
selected. Its median uses sorted exact-decimal values: the middle value for an
odd population and the exact arithmetic mean of the two middle values for an
even population. `Closest-to-median` minimizes exact absolute distance. Ties in
all three representative slots resolve by exact event timestamp, normalized
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
each retain at least one candidate when an eligible candidate exists.

The brief includes lane rank and a `requiredConsideration` tier:

- the engine identifies one default selection for friction, improvement,
  strength and follow-through before the provider call;
- the engine precomputes each section's bounded alternatives from the top three
  lane candidates using the score, confidence, overlap, focus and specificity
  rules; the later review-plan builder cannot nominate another candidate or
  reason;
- `What held you back` and `What improved` use their default unless one of
  those frozen alternatives appears in an authorized complete review plan;
- if no improvement qualifies, the engine supplies a specific unchanged or
  mixed comparison with its weekly series, followed by a concrete execution or
  maintained strength when one exists; generic `no clear improvement`
  boilerplate is not a complete section;
- a genuine strength must appear in the opening or improvement section when a
  high-confidence strength exists; placing it only in a future focus does not
  count as recognizing it;
- follow-through must use the highest-ranked measurable earlier focus unless a
  higher-confidence later focus covers materially more evidence.

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
- improvement and held-back cannot select the same finding, purpose and primary
  measurement;
- repeated evidence and subjects obey the cross-section overlap limits;
- a required genuine strength appears in the opening or improvement section;
- no two rendered clauses repeat the same factual job;
- focus questions are distinct and compatible with the selected findings;
- incomplete-record language matches the exact coverage state; and
- every final visible field fits the output and sentence budgets below.

The default review plan is the first globally valid plan under the section
defaults and deterministic conflict resolution. Other plans are ordered by
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
dispatch-recovery-state and selection-audit tables plus a new immutable v3
issued-review table. New periodic and monthly v3 output contracts retain the
same visible fields while using new contract and prompt/renderer versions. The
existing customer read model and page read v2 and v3 rows into the same visible
shape; every already-issued v2 row remains unchanged.

The planned table identities are `coach_ai_review_insight_snapshots`,
`coach_ai_review_insight_provider_dispatches`,
`coach_ai_review_dispatch_recovery_state`,
`coach_ai_review_insight_selection_audits` and
`coach_ai_issued_reviews_v3`. The four review/request tables carry the request's
account scope and participate in erasure. The recovery-state table is one
database-wide singleton, carries no account facts and is never erased with one
account. All five participate in administration, backup/restore and integrity
verification. Snapshot, selection-audit and issued rows reject ordinary
updates/deletes. A dispatch row permits only the fenced lease/dispatch/
settlement transitions defined below, becomes immutable when fully settled and
always rejects ordinary deletion. The recovery singleton permits only the
restore/startup epoch transition defined below and cannot be deleted.

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

### Insight snapshot

One account-scoped insight snapshot is created atomically with each new period
request and contains:

- request reference and source input/evidence digests;
- full normalized prompt-safe calculation source JSON and digest, including
  complete exact-month Analyzer evidence;
- prompt-safe reference derivation version, never HMAC key material;
- insight-engine version;
- renderer, section-plan, review-plan and provider-selection schema versions;
- frozen provider key/model ID, selection-instruction bytes/digest, strict
  structured-output schema bytes/digest, provider-envelope version and safe-
  context/token-count profile, never credentials or API secrets;
- complete eligible candidate JSON and digest;
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
rebuilt with omitted monthly facts. When an otherwise activated and authorized
request cannot fit or reserve that complete envelope, the coordinator issues
the already-frozen deterministic default with `provider_input_limit` or
`provider_reservation_refused` provenance and makes no partial provider call.
The local engine has still calculated the review from the complete exact source.

Issued and pending requests created before insight-engine activation are not
retrofitted. Already-issued reviews remain immutable. A pre-activation pending
request follows its original prompt path; every request created after the
activation marker must have an atomic insight snapshot or request creation
fails. This avoids silently mixing old inputs with new ranking behavior.

The migration uses the next available Coach migration identity at
implementation time because concurrent platform work may claim an earlier
number. The migration manifest, initialization digest, administration counts
and backup/restore verification must include all five new tables. Account-
erasure ordering includes the four scoped tables but never deletes the database-
wide recovery singleton.

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
- the provider projection passed its exact recursive field allowlist and
  forbidden private/internal-field scan before freezing, with no raw source,
  identity, attachment, secret, Data Decision or cross-account value;
- every compressed snapshot artifact reproduces its recorded canonical
  uncompressed length and digest before it is parsed or sent;
- a provider-selected path used the frozen provider/model/instruction/schema
  envelope and the dispatch's current recovery epoch, unexpired lease
  generation and matching fencing token;
- the selected complete plan, ordered section plans, focus questions, rendered
  output and digests exactly match the immutable snapshot;
- every selected finding and focus reference exists;
- `not_available` appears only with the exact engine-confirmed reason and its
  matching coverage, baseline or later-evidence state;
- every selection is eligible for its visible lane or the exact engine-
  authorized fallback mode;
- default-selection, per-section distance, whole-plan 12-point loss and exact
  compensating-benefit rules are respected;
- cited trades belong to the selected finding;
- cited notes belong to the selected finding/evidence record and note-derived
  prose is explicitly attributed to the trader;
- every section `claimRef` is an authorized semantic claim for the selected
  finding and its server-rendered fact clause is assembled without provider
  modification;
- every rendered count, percentage and money value exists in that exact claim's
  measurements, matches its server-generated display literal and keeps the
  affected-versus-money-eligible coverage clause;
- identical display literals belonging to different metrics, subjects or
  denominators cannot satisfy one another's claim reference;
- every selected `bridgeRef` is authorized for that exact section claim set and
  its position matches the frozen section plan;
- every financial claim uses the measurement's period-result, cohort-
  association or Analyzer-path attribution kind and does not convert
  association/giveback into invented causal or guaranteed-profit language;
- improvement has a valid earlier/later comparison, while an authorized
  no-improvement fallback has the exact series or maintained-strength evidence
  required by its mode;
- follow-through uses later evidence after the source focus;
- a recurring claim passes the recurrence gate;
- section purposes are valid, and sections cannot repeat the same
  `factualJobKey`, `coverageJobKey` or rendered-clause digest; same-subject
  improvement/friction uses different purposes and primary measurements;
- the global plan satisfies the strength, overlap, nonduplication and section-
  job constraints rather than only validating each section in isolation;
- hidden focus-tracking targets refer to measurable engine families;
- every next-period focus uses an engine-authorized distinct `focusTargetRef`
  linked to its source finding and is not a cosmetic duplicate of an earlier
  target;
- every `focusQuestionRef` is authorized for its exact target and supplies the
  complete visible next-focus question;
- the review-wide coverage limitation is attached exactly once through
  `incompleteRecord`, while measurement-local subset denominators remain in
  their owning fact clauses;
- every selected claim/bridge combination exists in the activated renderer
  coverage registry, including its grammar, currency, attribution,
  availability and partial-coverage variant;
- the review contains a strength when the brief contains a required strength;
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
- Every authorized complete review plan satisfies the four distinct section
  jobs, required-strength and cross-section overlap gates before provider input.
- The default and every alternative fit the renderer/output budgets, and no
  more than six complete plans enter the provider package.
- Every retained alternative stays within the whole-plan lane-loss limit and
  proves its exact overlap, focus-connection or specificity benefit; a merely
  different weaker plan is excluded.
- The month contains four issued weekly narrative contexts, not zero and not
  synthetic summaries created only inside the monthly fixture.
- Every permitted exact-month fact, note and Analyzer record is present once in
  the canonical monthly data, the four weekly reviews are also present, and
  August 31 facts are included exactly once.

### Realistic usefulness fixture

The 420-trade month is a scale and known-ranking stress test, not the only
product acceptance case. A second synthetic true-month fixture uses July 2026:
16 trades on July 6-10, 21 on July 13-17, 18 on July 20-24 and 25 on July 27-31,
with four actually issued weekly reviews and one ordinary July 1-31 monthly
review. July 1-2 contain no trades. It has varied short notes with some blanks,
a mix of preset and custom rules, ordinary missing/not-reviewed outcomes,
incomplete-but-usable Analyzer coverage, several modest winners and losers,
and no repeated boilerplate or 700-character note on every trade.

Its planted findings are intentionally less dominant: one financially material
repeated problem, one later-month improvement that remains a residual problem,
one credible maintained strength, one result/process contrast and one issued
Week 1 focus with Weeks 2-4 evidence. Expected ranks are asserted before the
provider call. The four weekly reviews and the complete exact-month facts must
enter the monthly package through the ordinary persisted flow. This fixture
fails unless the saved monthly review gives a trader direct, measurable and
non-repetitive takeaways even when no single pattern overwhelms the month.

### Provider quality and stability

After deterministic acceptance:

1. Generate the four weekly reviews sequentially.
2. Generate and persist the monthly review once through the ordinary flow.
3. Reopen and inspect the saved monthly review.
4. Replay the exact monthly provider package at least twice without persistence
   to test selection stability.
5. Require the same primary friction and improvement families across all
   selected authorized review plans. Representative examples cannot vary
   inside one frozen `reviewPlanRef`.
6. In a separate persisted run, exhaust provider selection attempts and require
   the byte-identical frozen default v3 output to issue with deterministic
   provenance and no fabricated provider receipt.
7. Reopen one legacy v2, one provider-selected v3 and one deterministic-default
   v3 review through the normal customer path.
8. Race a delayed valid provider response against the fallback boundary and
   prove exactly one path issues/notifies, the losing path cannot replace the
   review, and any real late usage is still settled to its failed attempt.
9. Run canonical packages just below and above the configured provider context
   envelope. Neither package may be truncated or split; the over-limit request
   must issue the same full-source deterministic default without a provider
   call.

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
- an activated provider's per-request reservation rejected before a call,
  repeated transport failures, invalid structured selections and exhausted
  retries, each reaching the exact frozen default without a fabricated receipt;
- the exact complete provider envelope immediately below and above its model-
  specific safe context boundary, proving no source fact is truncated,
  summarized or split into a second selection call;
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
- increasing a cohort's loss share cannot lower its financial-materiality
  component when every other input is unchanged;
- spreading the same affected observations across more cadence-appropriate
  independent buckets cannot lower repetition;
- lowering evidence coverage cannot increase confidence;
- making an otherwise unchanged lane dimension unavailable cannot increase the
  candidate's lane score;
- changing only free-text notes cannot change candidate eligibility,
  measurements, scores or ranks;
- changing `not_reviewed` to `broken` changes the correct numerator and
  denominator exactly once;
- adding `not_reviewed` outcomes leaves the reviewed broken rate unchanged,
  lowers review coverage and cannot create an improvement;
- a coverage shift beyond the versioned threshold cannot produce a clean rate
  improvement without a fixed common cohort;
- removing one outlier produces the documented sensitivity and confidence
  change;
- a rule-version change prevents a cross-version improvement claim;
- mixed currency suppresses money dimensions without deleting valid counts;
- cross-month facts never enter the wrong month's financial measurements;
- replacing only prior weekly visible prose cannot change a monthly candidate,
  measurement, score, claim clause or allowed selection;
- earlier/later comparison evidence sets are disjoint, and removing overlapping
  evidence either creates two gate-passing remainders or makes the comparison
  unavailable;
- incomplete money coverage always exposes affected and money-eligible counts,
  cannot render a full-cohort money claim and cannot label covered-subset P/L as
  the period total;
- provider serialization cannot alter the frozen engine snapshot;
- provider serialization emits only recursively allowlisted prompt-safe fields;
  adding any unknown/private/internal field fails even when context remains;
- package, provider exception, support and Admin logging contains no raw note,
  historical review, provider prompt or rendered private review text;
- every normalized source snapshot is transactionally consistent across
  Journal, rule, note, Analyzer and issued-focus reads;
- an idempotent request race returns one request and its one winning insight
  snapshot while discarding any losing calculation, including a different
  later-state digest;
- a retry reads the original shortlist after later Journal edits;
- moving the source review's issuance timestamp later excludes every trade,
  event and day aggregate that occurred before the focus was actually issued;
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
  and issues the same complete-source default without a provider call;
- one authorized plan short-circuits provider selection only after normal
  activation/configuration/authorization and records `single_authorized_plan`;
- a deterministic fallback is impossible after any scope, entitlement,
  account/platform feature-control, source, engine, renderer, safety, contract,
  persistence or stopped-request failure, or invalid provider configuration at
  request creation;
- a retry after renderer deployment changes returns the original rendered
  output digest;
- existing v2 rows and both v3 generation sources parse to the same visible
  customer shape without rewriting v2 history.

An independent reference calculation verifies period totals, rule-cohort P/L,
loss/profit shares, coverage-adjusted comparisons, weekly rates, medians, every
applicable component score, normalized lane weights, post-lane penalties,
allowed alternatives, final ranks, section-plan ordering, bounded global-plan
retention, default review plan and rendered-output digests without calling the
implementation's aggregation, scoring, plan-builder or renderer helpers.

## Performance and resource boundary

The owner computer may be resource constrained. Candidate generation must be
bounded approximately by trades plus rule outcomes plus Analyzer events, using
maps and precomputed denominators. Do not compare every trade with every other
trade.

- One pass builds indexes and period totals.
- Family generators consume those indexes.
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
- A new safety limit requires measured database/provider evidence and a plan
  update; no arbitrary trade-count or snapshot-byte refusal is introduced.
- Focused static scripts and type checks run with one worker where applicable.
- Do not run Vitest, broad regression or production builds during active
  implementation.

## Observability and support audit

For each generated review, retain server-side:

- insight-engine version;
- candidate counts by family and lane;
- complete shortlisted candidate measurements and ranks;
- component applicability, raw values, normalized weights and calculation
  traces for every shortlisted score;
- eligibility gates, confidence adjustments, penalties and sensitivity results;
- provider selections and request-local choice-key resolution;
- authorized review-plan count, default/selected `reviewPlanRef`, renderer and
  selection-schema versions, frozen provider/model/envelope identities,
  canonical/compressed provider-package byte counts, token counts and digest,
  rendered-output digest and generation source;
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
  eligible counts in its server-rendered fact clause.
- **Provider selects an invalid or unknown plan:** reject that attempt and retry
  from the immutable package.
- **Exactly one authorized plan exists:** after normal activation,
  configuration and authorization, issue it as a deterministic single-plan
  result without a pointless provider call or receipt.
- **After feature/provider activation and ordinary request authorization, a
  per-request reservation, transport, structured-output or all retry attempts
  fail:** issue the frozen deterministic-default review plan when it already
  passed every engine, renderer, output-safety and v3 contract check. Record the
  precise fallback reason and `deterministic_default` source without inventing
  provider usage or a receipt. This is the same evidence-backed rendered plan,
  not a generic degraded review.
- **Complete provider package exceeds the configured safe model envelope:** do
  not truncate, summarize or split it. After the normal activation and
  authorization gates, issue the complete-source deterministic default with
  `provider_input_limit` and make no provider call.
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
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-ranking.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-shortlist.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-canonical.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-selection-validator.ts`
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-renderer.ts`
- `src/modules/coach/server/coach-ai-review-insight-repository.ts`
- `src/modules/coach/server/coach-ai-review-insight-dispatch-recovery.ts`
- one next-available forward Coach insight migration under
  `src/modules/coach/server/database/migrations/`
- `src/scripts/verify-coach-ai-review-insight-engine.ts`
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

No dashboard presentation, Trade Tracker editor, Journal fact writer, legacy
V3 runtime, scheduler activation, hosted configuration or deployment file
belongs to this implementation. A Help/Privacy mismatch found at final review
becomes a separate owner-approved copy slice rather than being silently bundled
into engine code.

## Implementation slices

### Slice A - deterministic contracts and calculations

- Add engine contracts, prompt-safe rule identity and exact measurement
  helpers.
- Build normalization, denominators and candidate family generators.
- Add score explanations, penalties, overlap handling and lane rankings.
- Add a count-only fixture harness with planted expected ranks.

### Slice B - provider shortlist and structured selections

- Serialize the balanced insight brief ahead of raw context.
- Add server-owned fact, bridge and focus-question clause catalogs.
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
- Preflight the complete unsplit provider envelope against the configured model
  budget without omitting exact-month source facts.
- Add v3 output/issued-review persistence, dual v2/v3 reads, exact provenance,
  deterministic fallback, single-winner issuance/notification and immutable
  retry/late-usage behavior.
- Preserve existing visible review fields and all legacy v2 output reads.

### Slice C - weekly focus tracking

- Store hidden target metadata for newly issued weekly and two-week focuses.
- Use the metadata in later weekly and monthly follow-through candidates.
- Preserve lower-confidence compatibility for already-issued reviews.

### Slice D - true-month live acceptance

- Generate four sequential weekly reviews and one monthly review from both the
  420-trade stress fixture and the 80-trade realistic fixture through the
  ordinary issuance flow.
- Prove all four issued weekly reviews entered the monthly package.
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
- Verify below/above-context packages remain complete and choose provider or
  deterministic issuance without truncation or splitting.
- Run bounded non-persisted stability replays.

### Slice E - documentation and handoff

- Record exact accepted formulas, engine version, known limitations and live
  outputs.
- Update the narrative-quality progress record and AI Review beta handoff.
- Compare the exact provider field allowlist and immutable retention behavior
  with AI Reviews Help and Privacy language. Any visible correction requires
  owner copy approval; do not assume internal ranking alone makes the expanded
  monthly factual projection disclosure-neutral.

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
8. **Context handling could silently omit evidence:** fixed by freezing one
   canonical copy of every permitted exact-month fact plus all four issued
   weekly reviews and forbidding truncation, summarization or independent
   selection subpackages.
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
4. **The new full monthly projection/retention behavior lacked a disclosure
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

## Completion boundary

This redesign is complete only when:

- each request is calculated from one consistent account-scoped source
  snapshot rather than a hybrid of concurrent Journal revisions;
- every provider field is explicitly allowlisted and private/internal/cross-
  account data cannot enter packages, logs, Admin or support output;
- deterministic planted findings, independent score calculations and sealed
  holdouts rank correctly before provider involvement;
- the monthly provider package contains the four actually issued weekly
  reviews and every permitted exact-month fact, while historical prose cannot
  change a current monthly measurement or claim;
- every available visible section identifies a useful finding and does not
  duplicate another section's explanatory job;
- every authorized whole-review plan passes global compatibility and renderer
  limits before the provider can select it;
- `What improved` uses a real comparison or the exact engine-authorized no-
  comparison fallback;
- `What held you back` identifies measurable affected behavior and impact;
- financial wording preserves result/path/association boundaries and never
  presents overlapping cohort P/L as caused or additive loss;
- every earlier/later comparison uses disjoint evidence and every partial-money
  claim states its exact covered subset;
- follow-through connects an issued focus only to evidence occurring after its
  actual issuance boundary;
- an available genuine strength is recognized;
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
  summarizing or splitting monthly facts;
- retries preserve the exact pinned provider/model/instruction/schema envelope
  with no silent model failover, while account/platform disable and entitlement
  revocation still prevent deterministic issuance;
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
- existing v2 and both v3 generation sources reopen through one customer read
  path without changing old output;
- repeated live monthly generations retain the same main friction and
  improvement families;
- the saved review reopens through the normal customer read path;
- the owner judges the resulting review materially useful to a trader.
