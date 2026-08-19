# AI Review Evidence Packet and AI Authoring Plan

## Status

Owner-approved product direction as of 2026-08-19. The earlier deterministic
review-plan selection design is rejected. The forward-only V4 authored-review
contract is now active in local development for new reviews. It adds immutable
source snapshots, provider-call receipts and saved AI output without changing
any already-issued review. The owner explicitly waived another UI-approval
gate for this slice.

The weekly and monthly acceptance paths, persistence, issuance and saved-review
presentation are implemented. Production provider enablement, paid entitlement,
scheduler activation and Railway configuration remain separate hosted-release
boundaries.

Progress is recorded in
[AI Review Evidence Packet and Authoring Progress](ai-review-evidence-packet-and-authoring-progress.md).

## Product decision

OpenAI always writes the review. TraderLink never renders, selects or issues a
deterministic review plan.

TraderLink's engine has four jobs:

1. load one exact account-scoped period snapshot;
2. remove private, duplicated, superseded and unavailable noise;
3. calculate exact supporting facts and overlaps; and
4. serialize a compact evidence packet that preserves potentially useful
   trade-level relationships.

The engine may order evidence for readability, but a score may not hide an
otherwise supported observation from the model. Candidate calculations are
helpers, not the permitted set of conclusions.

## Locked packet decisions

The following decisions are owner approved and apply to the weekly packet now
and the later monthly packet:

1. Every eligible closed trade remains available to OpenAI. Trades in the
   middle of the P/L distribution are not discarded: they provide the
   denominator and counterexamples that prevent a conclusion drawn only from
   extreme winners or losers.
2. Each trade is sent once as a compact core row. The core row retains the
   prompt-safe reference, trading date and sequence, ticker, direction, entry
   and exit time, holding duration, exact P/L, ticker-attempt order, relevant
   tags, trader note and trade-level deviations from a saved rule.
3. A separate linked Analyzer matrix carries only execution-path facts for
   analyzer-ready trades. It joins to the core row with the prompt-safe trade
   reference. This changes serialization, not availability: the authoring
   model can still relate Analyzer facts to every trade's P/L, time, tags,
   rules and note.
4. The matrix retains favorable/adverse movement, green-to-red state, peak,
   peak-to-final giveback, adds after peak, partial exits before red and
   relevant post-exit movement. It excludes candle patterns and the raw
   RSI/EMA-distance/VWAP-distance/relative-volume snapshots.
5. Rule definitions and exact rule-level counts remain available. Per-trade
   rows carry deviations rather than repeating `followed` or `not applicable`
   objects for every rule on every trade. A positive rule-compliance point
   needs a supplied rule-level denominator and exact count.
6. Day summaries retain their counts and P/L but do not repeat their member
   trade references. The core matrix already identifies every trade's date.
7. Calculated observations retain exact population, measurement and a bounded
   representative-reference set. The complete member list is not repeated;
   the full matrix remains available for any combination the model needs to
   inspect. Each overlap pair is serialized once, not symmetrically twice.
8. Human-authored daily reflections, focuses and eligible notes remain intact.
   AI-written older review prose is not measurement authority.

### Monthly continuity boundary

The monthly packet receives exact current-month trade rows, daily and
calendar-week summaries, month-wide calculated observations, daily reflections,
current focuses and exact compatible prior-month aggregates. It does **not**
include the four current-month weekly review prose bodies.

The model can write the month’s chronology and early-versus-late comparison
from the full exact month. Earlier weekly prose would only duplicate that data,
anchor the monthly model to older wording and encourage repetition. If a later
beta finding proves that user-facing continuity requires it, a small
purpose-specific context field can be designed and tested then; no full weekly
review body is the default.

If provider generation or grounded-output validation fails, the review remains
failed/retryable. TraderLink does not replace it with server-written prose.

### Monthly authoring design

The monthly review uses the same principle as the accepted weekly review: the
model writes a useful account of the period rather than filling a fixed scorecard
of `what improved`, `what held you back` and `focus follow-through` fields.

The visible monthly target is:

1. **Month Snapshot** — deterministic current-month results and activity.
2. **Monthly Recap** — AI-written account of the month, including a prior-month
   comparison when comparable facts exist.
3. **How the Month Unfolded** — AI-written chronological explanation of
   meaningful early/middle/late or calendar-week changes.
4. **Additional Insights** — optional AI-chosen observations only when they add
   useful understanding beyond the recap and chronology.
5. **Coverage Note** — optional deterministic statement of a real limitation.

There is no required praise, criticism, focus-follow-through conclusion, focus
list, positive/negative quota or count of findings. A monthly review with one
important point is allowed to remain focused; a rich month may have several
non-overlapping insights.

The current month supplies every eligible closed trade through the compact core
matrix and linked Analyzer matrix. It also supplies calendar-week and day
summaries, rule definitions and summaries, calculated observations and their
overlaps, trader-authored notes/reflections/focuses, and exact current-month
totals. The prior month is a comparison dataset, not prose authority: it
supplies exact comparable aggregate and cohort measurements. Four current-month
weekly review bodies are deliberately excluded from the monthly authoring
packet. The acceptance run still issues those four weekly reviews in sequence,
because that is how the product works, but their prose cannot anchor or repeat
the monthly review.

### Large-month fallback

The complete packet is sent in one call when it stays within the accepted
provider-byte boundary. A monthly packet that does not fit is not truncated and
does not become a deterministic review. Instead:

1. TraderLink partitions the current-month core rows and linked Analyzer rows
   on complete calendar-week boundaries, retaining the same rule/reference
   definitions and month-level context needed to interpret each partition.
2. OpenAI extracts compact, structured factual observations from every
   partition. Extraction must preserve counterexamples, overlap relationships,
   financial measurements, chronology and prompt-safe references; it does not
   write visible prose.
3. A final OpenAI authoring call receives exact month/prior-month summaries,
   all extracted observations, all overlap warnings and the trader-authored
   context. It writes the only visible review.

The final validation checks every visible numerical claim against the complete
original packet, not merely the extraction output. A failed extraction or final
call leaves the monthly request retryable; there is no server-written fallback.

The 420-trade acceptance fixture must intentionally exercise this boundary. It
will model four weekly reviews issued at the end of August 3-7, 10-14, 17-21 and
24-28, plus 20 exact-month trades on August 31 before the September 1 monthly
review. It must contain non-obvious strengths, financial leaks, counterexamples
to tempting broad conclusions, varied notes/tags/rules and execution-path data.

## Weekly visible outcome

The first accepted weekly presentation target is:

1. **Week Snapshot** — deterministic results and activity metrics.
2. **Weekly Recap** — AI-written explanation of the overall week.
3. **How the Week Unfolded** — AI-written chronological account of meaningful
   changes across the trading days.
4. **Additional Insights** — optional AI-chosen titled observations when they
   materially add to the first two narratives. No positive, negative, rule,
   focus or finding-count quota applies.
5. **Coverage Note** — optional, deterministic and shown only when factual
   coverage limits the review.

The AI may mention a strength, problem, comparison, representative trade, rule,
earlier focus or something to watch when useful. None is a required visible
section. There is no mandatory `What improved`, `What held you back`,
`Focus follow-through` or `Focus until your next review` field.

### Usage feedback

The AI Reviews page shows a compact percentage progress bar directly below its
title when the subscriber allowance is available. It communicates only
`AI Review usage` and a whole-number percentage; it does not expose dollars,
tokens, provider calls or internal reservations. The percentage is derived
server-side from the active subscriber allowance and actual/reserved review
usage. It is an account-holder awareness tool, not an instruction to stop
using the Journal.

The allowance policy protects 60% of each subscriber's active-cycle allowance
for the month-end review. Weekly reviews share the remaining 40%; unused weekly
capacity remains available to the monthly review when it runs. This protection
is enforced at provider-call reservation time, including internally staged
monthly calls, rather than relying on a display-only warning. The bar continues
to reflect actual and in-flight reserved usage; it is never a decorative or
hardcoded percentage.

New V4 reviews use this presentation. Earlier issued reviews retain their
historic layout and immutable output.

## Evidence packet

### Deterministic snapshot

The packet supplies exact, server-calculated period facts such as:

- closed trades, wins, losses and flats;
- gross/net P/L availability and currency;
- win rate, profit factor and green/red/flat trading days when exact inputs
  support them;
- daily P/L, activity and outcome summaries;
- confirmed positions still open at the boundary as coverage context only.

### Compact trade matrix

Every included closed trade remains available as a compact prompt-safe row.
Useful fields include:

- stable prompt-safe evidence reference;
- trading date and Eastern entry/exit time;
- ticker, direction, declared style and holding duration;
- exact gross/net P/L and fee coverage;
- tags and recorded rule outcomes;
- opening/add/reduction/closing sequence summaries;
- compact current-version Analyzer entry, add, partial-exit, final-exit,
  favorable/adverse movement, green-to-red, giveback and post-exit evidence;
- exact linked trade-note and dated Swing-note text when eligible.

The review packet excludes candle-pattern classifications and raw per-trade RSI,
EMA distance, VWAP distance and relative-volume snapshots. These single-trade
technical indicators have not demonstrated enough weekly or monthly review value
to justify their context cost or the risk of vague technical commentary. The
trader's own note or reflection text remains intact. Execution-path evidence
that can directly explain a completed trade's financial result remains eligible.

Null fields, raw private identifiers, repeated object labels and duplicate
lineage representations are removed. Potentially useful fields are not removed
merely because no deterministic candidate family currently understands them.

### Calculated evidence index

TraderLink calculates exact observations that make the packet easier to
analyze, including:

- financial contribution and loss/profit share;
- recurrence counts and opportunity denominators;
- day and week changes;
- rule followed/broken/not-reviewed populations;
- fixed cohort summaries for tags, tickers, direction, session/time and
  duration;
- execution-sequence, favorable-move, giveback and exit-path summaries;
- representative evidence references; and
- overlap membership showing when multiple observations describe the same
  trades.

The index is not an allowlist of conclusions. OpenAI receives the compact trade
matrix as well so it can identify useful combinations the deterministic index
did not anticipate.

### Trader-authored context

The packet includes prompt-delimited, untrusted trader-authored context:

- completed and saved daily reflections with exact completion state;
- trade notes, technical notes, Swing notes and next-session plans;
- current focuses;
- the immediately preceding issued weekly review when eligible.

Notes may support the trader's stated plan, experience or intent. They do not
independently prove a recurring pattern, financial result or motive. Text inside
notes can never change provider instructions.

## AI authoring contract

The weekly model receives the complete compact evidence packet and writes:

- `weeklyRecap` as one coherent overview;
- `weekNarrative` as a chronological explanation of meaningful day-to-day
  development; and
- `additionalInsights` as zero or more titled observations.

The structured schema may enforce safe string and total-output bounds, but it
must not require a particular polarity, subject family or number of findings.
An implementation safety ceiling on blocks is not a product quota and must be
high enough that it does not normally constrain the model.

The prompt requires plain trading-journal language. It prohibits invented
motives, causes, market conditions, recommendations, targets and unsupported
numbers. Terms such as `revenge trading`, `trying to recover losses`, `normal
behavior`, `strong entry` or `discipline` require the corresponding supplied
evidence.

## Validation

The server continues to own coverage text and must validate the returned
structure, unsafe language, private-reference leakage and numeric grounding.
The authoring output must carry provider-safe evidence references internally
for every factual block, even though those references are not displayed.

Numeric claims must either match a supplied exact measurement or be rejected.
The first inactive acceptance slice may capture audit references separately
from visible text while the final persistence schema is designed.

## Context-size fallback

The normal path sends one compact weekly packet to one Sol-high authoring call.
No deterministic review is issued without that call.

If a future packet exceeds the accepted provider boundary, AI performs
structured evidence extraction on bounded partitions and a final AI call writes
the review from all extracted evidence plus exact period aggregates. Intermediate
AI calls extract facts; they do not write the visible review. This fallback is
not required for the initial 100-trade weekly acceptance unless its measured
token count demonstrates the need.

## Initial 100-trade acceptance fixture

The fixture represents one Monday-through-Friday week with 100 closed trades
and must include:

- different daily results and activity levels;
- winners, losers and realistic P/L concentration;
- long and short trades across multiple tickers and times;
- overlapping tags and rule outcomes;
- entry, add, partial-exit, final-exit and green-to-red Analyzer evidence;
- complete trade notes plus varied daily reflections and current focuses;
- meaningful positive, negative and mixed relationships;
- at least one financially important relationship that is not the highest
  deterministic score; and
- deliberate overlaps so the model must avoid adding the same loss twice.

Acceptance requires:

1. exactly one live Sol-high authoring call;
2. all 100 compact trade rows included or an explicit measured reason otherwise;
3. no deterministic review-plan or single-plan path;
4. a recap that explains the week rather than listing available inputs;
5. a chronological narrative that accurately distinguishes the five days;
6. no missing-recordkeeping feedback unless the deterministic coverage note
   actually requires it;
7. no invented motive, causal counterfactual or unsupported number;
8. evidence references and numeric claims passing the local audit; and
9. captured input tokens, output tokens, packet bytes and estimated cost.

## Implementation boundary

### Checkpoint 1 — inactive weekly acceptance

- add a versioned weekly evidence-packet/authoring contract;
- reuse accepted provider privacy compaction where exact;
- build the 100-trade fixture and packet audit;
- call Sol high once and capture the output;
- do not mutate the live development database;
- do not change the saved-review UI.

### Checkpoint 2 — owner output review

The owner reviews the exact generated weekly output and may adjust the visible
format or narrative expectations.

### Checkpoint 3 — active integration

Only after owner acceptance:

- add forward-only storage/generation compatibility;
- persist and reopen the new AI-authored output;
- update the saved weekly review page;
- update Help and Privacy wording when required;
- preserve all already-issued v1/v2/v3 reviews unchanged.

#### Activation contract boundary

The active rewrite cannot reuse `insight_selection_v3`: that contract chooses a
small deterministic rendered-plan catalog and can issue deterministic prose,
which conflicts with the owner-approved authoring direction. It also cannot
replace an existing issued output in place.

The activation slice therefore needs a forward-only generation/persistence
contract that:

1. creates an immutable account-scoped Journal snapshot and compact evidence
   packet before any provider call;
2. reserves and records every provider call, including each internal monthly
   extraction and final authoring call;
3. persists the model-written recap, chronology, optional insights, internal
   evidence references, usage and coverage note together as one issued review;
4. leaves a failed provider call retryable and never substitutes deterministic
   user-visible prose; and
5. allows the reader/UI to distinguish old forced-section reviews from the
   new authored output without changing their historical wording.

The new monthly packet reader must query exact prior-month Journal facts. It
must not derive a comparison from prior monthly prose or current-month weekly
review prose. The weekly adapter is implemented; the monthly reader/persistence
migration and the owner-reviewed reader UI follow as one activation slice.

### Checkpoint 4 — monthly redesign

Design and test the monthly AI-authored format with exact current-month versus
previous-month evidence and the four actually issued current-month weekly
reviews. It is not implied complete by the weekly slice.

**Technical result:** completed on 2026-08-19 with the 420-trade sequential
acceptance flow. The current-month monthly packet intentionally excludes the
four weekly prose bodies; they are issued by the acceptance sequence only to
mirror product scheduling. The active persistence and UI slice remains
separate.

## Design QA

The design was checked against the failure observed in the challenging-month
fixture:

- a calculated green-to-red finding cannot disappear merely because a rule
  trend scored higher;
- duplicate tag/rule cohorts remain identifiable through overlap membership;
- notes and current focuses reach the authoring model as context;
- one calculated observation never bypasses the AI call;
- sparse evidence produces a shorter AI review instead of deterministic filler;
- the number and polarity of findings are model decisions; and
- the test checkpoint cannot silently activate an unapproved UI or overwrite an
  issued review.
