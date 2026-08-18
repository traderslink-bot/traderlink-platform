# AI Review Insight Ranking Engine Plan

## Status

Design and implementation-readiness QA pass complete under the owner's
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
job is to select a coherent combination of supported findings and explain them
in normal trader-facing language.

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
5. Build a balanced 15-25 candidate provider brief with required-consideration
   ranks and representative evidence.
6. Ask the provider for structured section selections and prose tied to exact
   candidate references.
7. Validate the selections and supporting values before the existing issuance
   service can persist the review.

Candidate generation and ranking must remain a pure, deterministic operation.
The same immutable input and engine version must produce the same candidates,
measurements, scores and ordering.

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
findings so the provider can explain the trader's own context. A note alone may
support a specific example, but it cannot create a recurring pattern, assign a
motive or increase a candidate's financial/repetition rank. Future structured
plan fields would require a separate accepted contract.

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

If a rule changes materially during a month, trend calculations split at the
version boundary. The engine must not claim improvement across two different
thresholds or statements merely because they share a stable rule identity.

### Prompt-safe trade references

Each exact-period trade receives a stable reference derived from its ordered
position in the immutable package, for example `trade_2026_08_18_003`. A
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

No private round-trip, execution, account or user identifier is exposed.

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

### Monthly calculation before provider deduplication

The current monthly snapshot intentionally removes raw Analyzer detail from
dates already represented by an issued weekly review before serializing the
provider package. That token-saving boundary cannot become the insight
engine's input boundary.

Monthly candidate calculation must run while the local snapshot builder still
has the complete exact-month weekly snapshots and their Analyzer evidence. It
then freezes the derived candidate brief, measurements, representative compact
evidence and source digests into the immutable monthly request. Only after that
step may the provider serializer omit duplicated raw Analyzer/reflection detail.

This preserves all-month Analyzer calculations without sending the same raw
evidence twice. A provider retry uses the frozen brief; it never reopens later
Journal state or recalculates against edited evidence. Weekly inputs remain the
immutable audit source for Analyzer evidence represented through an issued
weekly review.

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
penalties[]
rankExplanation[]
```

Each measurement contains a stable metric name, exact value, unit, numerator,
denominator and availability state. Provider prose is never used as a
measurement.

`engineVersion` freezes candidate families, gates, formulas, weights and tie
breaks, for example `traderlink_ai_review_insights_v1`. `findingRef` is a
deterministic prompt-safe digest of engine version, period, family, subject,
cohort and comparison definition. Input order cannot change it. Existing
requests always use their frozen engine version even after later calibration.

Every directional metric also declares its interpretation explicitly:
`lower_is_better`, `higher_is_better` or `context_only`. The engine never
infers improvement direction from a metric name or provider prose.

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
- later-session trades after a day was already materially green or red;
- P/L and rule outcomes for each sequence cohort;
- whether the pattern repeated on separate days or weeks.

This family uses exact chronology and existing evaluated rules. It does not
infer revenge, frustration or motive from trade order alone. A trader-authored
note or named rule may support the trader's own behavioral label.

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
receive a recurrence penalty and cannot be described as repeated behavior.

### 11. Ticker, tag, session, direction, time and duration cohorts

Generate a cohort only when the compared population is large enough:

- trade count, P/L, win rate and gross-loss share;
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

- source review reference and end date;
- originating finding family and subject reference;
- later metrics capable of evaluating it;
- baseline values and eligible later-evidence date;
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
- not measurable from later evidence.

The candidate records the exact later weeks, denominators, measurements and
contradictory evidence behind the verdict.

## Evidence gates

### General pattern gate

A recurring pattern normally requires either:

- at least three affected observations across at least two weeks; or
- at least two affected observations across separate weeks and a material
  financial contribution.

A single observation can qualify only as an explicit material outlier or a
specific execution example.

### Rule gate

- At least three reviewed outcomes are required for a rule rate.
- `not_reviewed` is excluded from followed/broken rate denominators and remains
  visible as coverage.
- A recurring broken-rule finding normally requires at least two breaks.
- One break may qualify as a material outlier when its loss represents at least
  10% of the period's total losing-trade P/L.
- Trend requires eligible reviewed outcomes in at least three week buckets and
  a non-empty early and later comparison population.

### Segment gate

A ticker, tag, session, direction or time segment normally requires:

- at least five trades; or
- at least three trades spread across two weeks;
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

Improvement or deterioration requires:

- at least three observed week buckets for a monthly trend;
- at least five eligible observations in both the early and later comparison
  populations for a rate trend;
- a family-declared primary metric and improvement direction;
- a meaningful count, rate, money or path change under the default thresholds
  below;
- later evidence after the comparison baseline;
- no material rule-definition change across the compared observations.

A flat or contradictory series produces an unchanged or mixed candidate, not
an improvement candidate.

The default meaningful-rate threshold requires at least two fewer/more
affected observations and either:

- at least a 10-percentage-point activity-weighted rate change; or
- at least a 5-percentage-point change, at least five affected-observation
  difference and support from three week buckets.

A money/path-only trend requires a comparable opportunity population, at
least three observations on each side, a 20% change in the median per-
observation value and an absolute contribution of at least 5% of the period's
total winning- or losing-trade P/L. These are initial versioned calibration
thresholds, not universal statistical truths.

When the earlier median is zero, relative percentage change is unavailable.
The candidate can qualify only through an explicit absolute materiality
threshold and the required affected-count/rate change; the engine never reports
an infinite or manufactured percentage improvement.

Each family declares one primary trend metric. Supporting P/L, count and path
measurements cannot be averaged together to hide disagreement. When a
material supporting metric moves in the opposite direction, the engine emits
a mixed candidate or lowers confidence instead of calling the behavior simply
improved.

### Strength gate

A recurring strength requires at least three examples across two weeks. One
trade can be a strength example when its process evidence is unusually clear,
but the review must not generalize it to the whole month.

## Exact measurements

All divisions expose the exact numerator and denominator and use the accepted
exact-decimal math utilities. Display rounding never changes ranking inputs.

Key definitions:

- **Total losing-trade P/L:** absolute sum of all negative included net trade
  P/L. This is a performance population, not the trade's unavailable broker
  gross-P/L field.
- **Total winning-trade P/L:** sum of all positive included net trade P/L.
- **Loss share:** absolute negative P/L inside a cohort divided by the period's
  total losing-trade P/L.
- **Profit share:** positive P/L inside a cohort divided by the period's total
  winning-trade P/L.
- **Broken rate:** broken divided by followed plus broken.
- **Affected rate:** affected eligible observations divided by the candidate's
  exact eligible population.
- **Week spread:** affected week buckets divided by eligible observed week
  buckets.
- **Peak-to-final giveback:** Analyzer-supplied peak-to-final reversal only; it
  is not recreated from unrelated price fields.
- **First-half/later-half change:** later activity-weighted rate minus earlier
  activity-weighted rate.

Average, median, contribution and profit-factor measurements are unavailable
when their required population or denominator is empty. The engine does not
store infinity, substitute zero or invent a display placeholder.

Money from different or unavailable currencies is never combined. When the
period lacks one comparable currency, financial candidate dimensions become
unavailable and count/rate dimensions remain eligible.

## Scoring dimensions

Every dimension is stored as an integer from 0 to 100 with its inputs and
explanation.

### Financial materiality

For negative candidates, the main component is cohort loss share. For positive
candidates, it is cohort profit share or protected measured profit. Giveback
candidates use measured reversal relative to the Analyzer-covered peak-profit
population. A secondary absolute-impact component prevents a low-activity
month from treating every small value as equally important.

The component is unavailable, not zero, when comparable money is unavailable.
Weights redistribute across the remaining dimensions.

### Repetition

The default repetition score combines:

- 45% affected rate;
- 35% count saturation, reaching full credit at eight affected observations;
- 20% week spread.

This prevents 420-trade months from winning solely through raw count while
still recognizing a problem affecting a high proportion of a smaller month.

### Trend magnitude

Trend uses activity-weighted early and later rates, supported by the complete
weekly series. A 25-percentage-point adverse-rate change reaches the default
full magnitude score. Smaller changes scale proportionally. Money and count
changes remain supporting measurements rather than being silently mixed into
the rate.

Trend consistency separately records how many intermediate week-to-week moves
support, contradict or remain flat against the overall direction.

### Process relevance

High-confidence preset risk, stop, sizing, re-entry and exit families receive
the highest process relevance. Entry, add, management and focus-linked
findings follow. Generic ticker/tag correlations receive lower process
relevance unless rule, note or Analyzer evidence directly connects them to a
reviewable behavior.

Custom rule titles do not receive semantic priority from keyword guessing.

### Evidence confidence

Confidence combines:

- required-field coverage;
- sample size against the family gate;
- week spread;
- agreement among rule, Analyzer and trader-authored evidence;
- sensitivity to the largest outlier;
- compatible fee and currency treatment.

Conflicting evidence lowers confidence but can create a useful mixed or
contrast candidate.

### Focus relevance

An exact hidden focus-tracking subject match receives 100. A structurally
matched legacy focus receives at most 60. General prose similarity alone
receives zero.

### Specificity and usefulness

A candidate scores higher when it has:

- an identifiable behavior rather than a broad outcome category;
- a clear denominator;
- representative trades or days;
- a measurable later review path;
- a conclusion that is not duplicated by a stronger candidate.

## Lane formulas

Weights are defaults to calibrate against planted fixtures. They are versioned
and inspectable rather than hidden in provider prose.

### Friction priority

- 30% financial materiality;
- 25% repetition;
- 15% process relevance;
- 15% evidence confidence;
- 10% persistence or adverse trend;
- 5% earlier-focus relevance.

If money is unavailable, its 30% redistributes proportionally across the other
dimensions.

### Improvement priority

- 35% trend magnitude;
- 20% financial improvement;
- 15% baseline recurrence;
- 15% earlier-focus relevance;
- 10% evidence confidence;
- 5% specificity.

### Strength priority

- 25% process evidence;
- 25% repetition;
- 20% positive financial participation or controlled loss;
- 15% cross-week consistency;
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
available financial materiality, repetition and finally lexical `findingRef`,
in that order. Provider output never breaks an engine-rank tie.

## Penalties and sensitivity checks

Apply explicit penalties after lane scoring:

- single-observation recurring-pattern penalty;
- one-day-only penalty;
- one-week-only penalty;
- largest-outlier dependence penalty;
- incomplete Analyzer coverage penalty;
- incomplete rule review coverage penalty;
- mixed-currency financial suppression;
- rule-version-change suppression;
- cross-month evidence restriction;
- duplicate or near-duplicate candidate penalty;
- weak comparison-population penalty;
- exploratory-cohort penalty for ticker, tag, weekday, time or duration
  findings selected from many eligible groups;
- contradiction penalty when rule, Analyzer and note evidence disagree.

No penalty silently deletes a candidate. The audit record shows the pre- and
post-penalty score and reason.

Exploratory cohort families must also record the number of sibling groups
tested. Their minimum sample, week-spread and outlier-resistance requirements
increase as sibling-group count increases. The engine does not claim a stable
pattern from the best-looking member of dozens of tiny tags or tickers merely
because one happens to have extreme P/L.

## Overlap and candidate merging

Each candidate retains its affected trade/day reference set and semantic
overlap keys. The engine calculates evidence-set overlap.

- Candidates in the same family and subject with at least 65% evidence overlap
  collapse into the stronger candidate.
- A narrower rule candidate may merge into a broader giveback candidate when
  the same rule and trades directly explain the relationship.
- Different rule findings remain separate even when some trades overlap.
- A candidate cannot claim the sum of P/L from overlapping cohorts.
- The provider shortlist normally uses a trade in no more than two visible
  sections. The opening may reuse the main section finding.

Representative examples are selected for both impact and typicality:

1. highest material contribution;
2. closest-to-median affected example;
3. most recent independent example.

This prevents every section from citing only the largest loser.

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
- the visible `What held you back` selection defaults to the first friction
  candidate and may use the second or third only when it is within ten score
  points and avoids material overlap or creates a stronger focus connection;
- `What improved` follows the same default/ten-point rule inside the
  improvement lane;
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

## Immutable persistence and atomicity

The existing v2 request stores one immutable provider input, while the issued
output contract stores only the visible review fields. Adding undocumented
optional fields to those JSON objects would weaken their versioned contract.
The insight workflow therefore uses a forward-only Coach migration and two
append-only private tables rather than silently changing already-accepted v2
output semantics.

### Insight snapshot

One account-scoped insight snapshot is created atomically with each new period
request and contains:

- request reference and source input/evidence digests;
- full normalized prompt-safe calculation source JSON and digest, including
  the Analyzer evidence used before monthly provider deduplication;
- insight-engine version;
- complete eligible candidate JSON and digest;
- balanced shortlist JSON and digest;
- calculation coverage and created time.

The table is keyed one-to-one to `coach_ai_review_period_requests_v2`, carries
the same user/workspace/account scope, has restrictive foreign keys and rejects
updates or deletes. Request creation computes the pure snapshot before entering
the repository transaction, then inserts the request and snapshot together. An
idempotent period-identity race must return the already-saved request and its
matching snapshot; it cannot replace the snapshot with a later calculation.

The calculation source contains only the fields needed to reproduce candidate
measurements and evidence selection. It may be larger than the provider brief,
but it is private local persistence and is not resent to the provider. Storing
only a digest would be insufficient because later Analyzer revisions could no
longer reproduce the monthly calculation. Storage-size verification must
measure this snapshot separately from provider-token cost.

### Attempt selection

Each provider attempt may append one private selection audit containing:

- attempt and request references;
- engine and shortlist digests;
- structured provider selection JSON and digest when parseable;
- validation state and a bounded failure code;
- issued-review reference only for the accepted selection;
- recorded time.

The selection table also rejects updates and deletes. The accepted selection's
focus targets are the authority for later follow-through. The customer-facing
v2 review JSON remains unchanged and the existing review page continues to
read its normal prose fields.

When building a later periodic or monthly insight snapshot, the repository
loads accepted focus targets for each included issued review and joins them to
the visible `nextPeriodFocuses` by review and focus ordinal. Missing audit data
on a legacy issued review takes the documented lower-confidence compatibility
path; it is never mistaken for a tracked target.

For an accepted attempt, the issued review, valid selection audit, receipt,
attempt finalization and request finalization are written in one transaction.
An invalid selection can append a rejected selection audit and finalize only
that attempt as failed; it cannot create an issued review.

### Retry and activation behavior

The runner reads the frozen insight snapshot by request ID and builds every
retry from the same input, candidate shortlist and digests. It never reruns the
engine against later Journal state. Reservation bytes and provider token counts
include the frozen shortlist.

Issued and pending requests created before insight-engine activation are not
retrofitted. Already-issued reviews remain immutable. A pre-activation pending
request follows its original prompt path; every request created after the
activation marker must have an atomic insight snapshot or request creation
fails. This avoids silently mixing old inputs with new ranking behavior.

The migration uses the next available Coach migration identity at
implementation time because concurrent platform work may claim an earlier
number. The migration manifest, initialization digest, account-erasure order,
administration counts and backup/restore verification must include both new
tables.

## Provider selection contract

The provider returns structured selections rather than only free prose:

```text
reviewSummary: text + selectionState + findingRefs[]
whatImproved: text + selectionState + findingRefs[]
whatHeldYouBack: text + selectionState + findingRefs[]
focusFollowThrough: text + selectionState + focusRef? + findingRefs[]
nextPeriodFocuses[]: text + sourceFindingRefs[] + tracking target
machineSelectionReasons[]
sectionClaims[]: section + findingRef + measurementRefs[] + tradeRefs[]
```

The existing customer-facing review continues to display the normal text and
focus list. New hidden selection metadata is stored with newly issued reviews
so future follow-through and support audits can identify exactly which finding
was used. Older v2 outputs remain readable without metadata.

The provider must choose different primary findings for improvement and
friction. A contrast candidate may support the opening and one other section.
Selecting a non-default lane candidate requires one machine-only reason:
`avoids_overlap`, `stronger_focus_connection`,
`stronger_evidence_specificity` or `stronger_section_coherence`. The server
checks the score-distance and reason; the reason is not customer-facing prose.

Every numerical or representative-trade statement must also appear in
`sectionClaims`. Counts are rendered as digits rather than unvalidated number
words. The existing prose grounding scan remains a secondary defense, while
measurement references provide the primary proof that a number belongs to the
selected finding.

`selectionState` is `selected` or `not_available`. `not_available` requires a
bounded engine-supplied reason and is accepted only when that lane or focus
truly has no eligible candidate. The provider cannot skip a populated lane by
declaring it unavailable.

## Server validation

Before persistence, validate that:

- every selected finding and focus reference exists;
- `not_available` appears only for an engine-confirmed empty lane or
  unmeasurable focus population;
- every selection is eligible for its visible lane;
- default-selection, score-distance and allowed-alternative rules are
  respected;
- cited trades belong to the selected finding;
- every section claim points to measurements and trades owned by its selected
  finding;
- every rendered count, percentage and money value exists in the section's
  selected measurement references;
- improvement has a valid earlier/later comparison;
- follow-through uses later evidence after the source focus;
- a recurring claim passes the recurrence gate;
- sections are not duplicate restatements;
- hidden focus-tracking targets refer to measurable engine families;
- coverage limitations remain attached;
- the review contains a strength when the brief contains a required strength.

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
   Weeks 1-2 to Weeks 3-4.
2. Green-to-red ended-red trades with measurable combined peak-to-final
   reversal, concentrated early but not eliminated later.
3. A separate harmful add-after-peak cohort with lower financial impact but
   strong repetition.
4. A one-off very large loser that must rank as a material outlier without
   being called recurring behavior.
5. Clean profitable trades with followed entry/risk/exit rules across all four
   weeks.
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
    denominators and coverage penalties.
13. Distinct daily and trade reflections based on the planted facts; no
    repeated boilerplate strength or weakness text.

The precise values are fixed before generation. The expected engine ranks are
asserted before any provider call.

### Expected engine behavior

- The planted major repeated problem ranks in the top three friction findings.
- The planted improvement ranks first or second in the improvement lane.
- The large one-off loser does not outrank the recurring major problem solely
  because of its size.
- The weak outlier-dependent ticker/tag pattern is visibly penalized.
- At least one clean execution or process strength reaches the provider brief.
- The Week 1 focus has measurable Weeks 2-4 follow-through.
- The month contains four issued weekly narrative contexts, not zero and not
  synthetic summaries created only inside the monthly fixture.
- August 31 facts are included exactly once.

### Provider quality and stability

After deterministic acceptance:

1. Generate the four weekly reviews sequentially.
2. Generate and persist the monthly review once through the ordinary flow.
3. Reopen and inspect the saved monthly review.
4. Replay the exact monthly provider package at least twice without persistence
   to test selection stability.
5. Require the same primary friction and improvement families across all
   monthly generations. Representative examples may vary only within the
   selected candidate's evidence set.

The review fails even when its prose is polished if it selects a materially
weaker candidate, omits an available strength, repeats one issue across all
sections or cannot connect follow-through to a real earlier focus.

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
- incomplete P/L;
- overlapping rule cohorts;
- one-trade outlier;
- contradictory notes, rule outcomes and Analyzer evidence;
- no eligible improvement;
- no measurable earlier focus;
- prior focus with clear improvement, mixed evidence and worsening evidence.
- first weekly review with no prior measurement baseline;
- later weekly review using a compatible frozen prior insight snapshot;
- engine-version change that makes a prior comparison incompatible.

### Deterministic and metamorphic checks

The focused engine verifier must also prove invariants that do not depend on
one planted fixture:

- reordering equivalent input arrays does not change candidate references,
  measurements, scores or ranks;
- a duplicate day, trade or rule outcome is rejected rather than double
  counted;
- increasing a cohort's loss share cannot lower its financial-materiality
  component when every other input is unchanged;
- spreading the same affected observations across more independent weeks
  cannot lower week-spread repetition;
- lowering evidence coverage cannot increase confidence;
- changing `not_reviewed` to `broken` changes the correct numerator and
  denominator exactly once;
- removing one outlier produces the documented sensitivity and penalty change;
- a rule-version change prevents a cross-version improvement claim;
- mixed currency suppresses money dimensions without deleting valid counts;
- cross-month facts never enter the wrong month's financial measurements;
- provider serialization cannot alter the frozen engine snapshot;
- an idempotent request race returns one request and one identical insight
  snapshot;
- a retry reads the original shortlist after later Journal edits;
- invalid candidate, measurement, trade and focus references all fail before
  issuance.

An independent reference calculation verifies period totals, rule-cohort P/L,
loss/profit shares, weekly rates, medians and the planted rank inputs without
calling the implementation's aggregation helpers.

## Performance and resource boundary

The owner computer may be resource constrained. Candidate generation must be
bounded approximately by trades plus rule outcomes plus Analyzer events, using
maps and precomputed denominators. Do not compare every trade with every other
trade.

- One pass builds indexes and period totals.
- Family generators consume those indexes.
- Evidence overlap uses compact reference sets only for eligible candidates.
- The engine emits a bounded shortlist regardless of raw trade count.
- Focused static scripts and type checks run with one worker where applicable.
- Do not run Vitest, broad regression or production builds during active
  implementation.

## Observability and support audit

For each generated review, retain server-side:

- insight-engine version;
- candidate counts by family and lane;
- complete shortlisted candidate measurements and ranks;
- penalties and sensitivity results;
- provider selections;
- rejected-attempt selection errors;
- final section-to-finding references;
- focus-tracking metadata;
- provider usage and cost through the existing receipt system.

Journal notes and private identities retain their existing privacy boundary.
Admin aggregate health views may later report candidate/selection counts but
must not expose private review prose or trade facts.

## Failure handling

- **No eligible friction:** describe the strongest supported strength or mixed
  result; do not manufacture a problem.
- **No eligible improvement:** provide the most informative unchanged or mixed
  weekly comparison instead of generic boilerplate.
- **No strength:** do not force praise unsupported by the record.
- **No measurable earlier focus:** explain that exact tracking was unavailable
  and generate measurable focus metadata for the next review.
- **Missing Analyzer:** continue with rules, results, tags, notes and chronology.
- **Missing reviewed rules:** continue with exact result and Analyzer families.
- **Insufficient money coverage:** suppress money scores and use counts/rates.
- **Provider selects invalid evidence:** reject and retry from the immutable
  package.
- **All provider attempts fail:** preserve the request under the existing
  retryable failure contract; never save a degraded generic review.

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
- `src/modules/coach/server/ai-review-insights/coach-ai-review-insight-selection-validator.ts`
- `src/modules/coach/server/coach-ai-review-insight-repository.ts`
- one next-available forward Coach insight migration under
  `src/modules/coach/server/database/migrations/`
- `src/scripts/verify-coach-ai-review-insight-engine.ts`
- one synthetic true-month fixture/helper under `src/scripts/`

### Existing source permitted to change

- `src/modules/coach/contracts/weekly-ai-review-input-contracts.ts`
- `src/modules/coach/server/coach-ai-review-supplemental-evidence-repository.ts`
- `src/modules/coach/server/coach-weekly-ai-review-input-service.ts`
- `src/modules/coach/server/coach-weekly-ai-review-input-runtime.ts`
- `src/modules/coach/server/coach-monthly-ai-review-input-runtime.ts`
- `src/modules/coach/server/coach-ai-review-request-service.ts`
- `src/modules/coach/server/coach-ai-review-repository.ts`
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
V3 runtime, Help page, scheduler activation, hosted configuration or deployment
file belongs to this implementation.

## Implementation slices

### Slice A - deterministic contracts and calculations

- Add engine contracts, prompt-safe rule identity and exact measurement
  helpers.
- Build normalization, denominators and candidate family generators.
- Add score explanations, penalties, overlap handling and lane rankings.
- Add a count-only fixture harness with planted expected ranks.

### Slice B - provider shortlist and structured selections

- Serialize the balanced insight brief ahead of raw context.
- Add structured section/focus selection references.
- Add server validation and immutable retry behavior.
- Preserve existing visible review fields and legacy output reads.

### Slice C - weekly focus tracking

- Store hidden target metadata for newly issued weekly and two-week focuses.
- Use the metadata in later weekly and monthly follow-through candidates.
- Preserve lower-confidence compatibility for already-issued reviews.

### Slice D - true-month live acceptance

- Generate four sequential weekly reviews and one monthly review from the
  420-trade August fixture through the ordinary issuance flow.
- Prove all four issued weekly reviews entered the monthly package.
- Inspect deterministic ranks before provider generation.
- Save, reopen and audit the monthly result.
- Run bounded non-persisted stability replays.

### Slice E - documentation and handoff

- Record exact accepted formulas, engine version, known limitations and live
  outputs.
- Update the narrative-quality progress record and AI Review beta handoff.
- Confirm whether Help needs a user-facing explanation; internal ranking and
  evidence selection alone should not require one.

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

No unresolved critical design blocker remains. Calibration values are
deliberately versioned defaults and must pass the deterministic planted and
metamorphic gates before any live provider acceptance is considered meaningful.

## Completion boundary

This redesign is complete only when:

- deterministic planted findings rank correctly before provider involvement;
- the monthly provider package contains the four actually issued weekly
  reviews and all exact-month facts;
- every visible section identifies a distinct useful finding;
- `What improved` uses a real comparison;
- `What held you back` identifies measurable affected behavior and impact;
- follow-through connects an issued focus to later evidence;
- an available genuine strength is recognized;
- provider selections validate against exact candidate references;
- repeated live monthly generations retain the same main friction and
  improvement families;
- the saved review reopens through the normal customer read path;
- the owner judges the resulting review materially useful to a trader.
