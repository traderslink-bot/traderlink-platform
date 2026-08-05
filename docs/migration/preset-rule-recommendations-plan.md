# Preset Rule Recommendations Plan

## Status

Planning only. This plan adds an evidence-led recommendation layer to the
existing automatically evaluated preset Rules. It does not create, activate,
alter, or retire a rule, make an AI request, or change any Journal fact until
the owner approves this plan and its calibration rules.

**Progress record:** [Preset Rule Recommendations Progress](preset-rule-recommendations-progress.md)

## Purpose

Help a trader discover a small number of existing preset Rules that are worth
testing because their own confirmed trading record shows a repeated pattern.
The product does not claim that a rule would have guaranteed profit. It shows
that a rule would have prevented or changed a defined set of later trades, and
that those trades had a repeatable factual result.

The Rules engine produces the evidence. AI Chat and AI Reviews may explain an
eligible recommendation in ordinary language, but may not invent, rank, or
activate a recommendation by themselves.

## Existing preset candidates

The current native replacement catalog supplies these candidates:

| Preset | Recommendation evidence |
| --- | --- |
| Avoid an entry-price range | Repeated underperformance in a trader-specific entry-price band, with enough comparable entries outside it. |
| Cooldown after a loss | Completed losses followed by fast re-entries with exact times and a worse repeated outcome than longer breaks. |
| Maximum ticker attempts per day | Later flat-to-flat attempts on the same ticker repeatedly underperform earlier attempts. |
| Maximum completed trades per day | Trades after a candidate daily count repeatedly underperform earlier trades on the same days. |
| No new trades after a selected time | Entries after a candidate Eastern-time cutoff repeatedly underperform earlier entries. |
| Stop after consecutive losses | Trades taken after a candidate losing streak repeatedly worsen day outcomes. |
| Stop after a daily realized loss limit | Later trades after a candidate realized loss threshold repeatedly worsen the day. |
| Stop a ticker after losing attempts | Later same-ticker attempts after a loss threshold repeatedly underperform. |
| Stop after a realized profit giveback | Later trades after a candidate daily peak/giveback point repeatedly deepen giveback. |
| Stop after a daily realized gain limit | Later trades after a candidate realized gain threshold repeatedly give back gains or underperform. |

The former retired catalog direction is no longer permanent. **Cooldown after a
loss is active.** The owner may later reconsider the other formerly removed
presets, but none is restored merely because this recommendation plan exists.

## What the detector can and cannot conclude

### It can measure

- confirmed completed Day-trade sequence, entry/exit time, exact realized P/L,
  ticker, weighted entry price, attempt number, count, and execution count;
- whether a candidate rule would have stopped a particular later trade;
- the combined and per-trade result of the affected later trades;
- the same comparison across multiple independent trading days;
- execution-density context: number of entries, adds, partial exits, and total
  executions inside a completed trade.

### It cannot conclude from executions alone

- whether a trader waited for a genuine setup, was emotional, or intended a
  particular strategy;
- whether an excluded trade would certainly have lost or a prevented trade
  would have changed its outcome;
- whether an open/swing position should be treated as an intraday behavior;
- that a price band is universally bad across every ticker or market regime.

Trader notes, selected tags, and future verified market-data coverage may add
context in a later approved feature. They never convert inference into fact.

## Eligibility and evidence gates

There is no fixed 90-day wait. A high-activity new trader can receive a first
recommendation after one full active trading week; a lower-frequency trader
accumulates evidence until the same gates are met.

### Shared eligibility

- Read only confirmed, eligible, ready-closed Day trades for the selected
  account. Open positions, intentional swings, contained Data Decisions, and
  incomplete values are excluded only from calculations that depend on them.
- Use the most recent 14 calendar days first, extending only as needed to
  obtain a representative eligible activity window. Never require a calendar
  duration merely because the trader had enough confirmed activity earlier.
- A first recommendation needs at least **three separate active trading days**,
  **20 completed eligible Day trades**, and **50 accepted execution events**.
  These are a gate, not evidence by themselves.
- Every candidate must have its own affected-trade minimum and must appear on
  at least three separate trading days. One volatile ticker or one bad day
  cannot create a recommendation.
- When more history exists, require the pattern to remain directionally
  consistent across recent and earlier portions of the available window rather
  than being driven entirely by the oldest activity.

### Candidate-specific gates

| Candidate family | Minimum factual evidence before it can be shown |
| --- | --- |
| Daily trade limit / ticker attempt limit | At least 8 trades that occur after the candidate limit, across 3 days, with a meaningful underperformance comparison against the earlier eligible trades from those days. |
| Cooldown / time cutoff | At least 8 exact-time trigger events across 3 days, plus a comparison group of trades outside the candidate window. |
| Loss streak / daily loss / gain / giveback | At least 5 threshold-reaching day events across 3 days and at least 8 later trades that the candidate would have blocked. |
| Losing ticker attempts | At least 6 later same-ticker attempts across 3 days after the candidate number of completed losses. |
| Entry-price band | At least 12 trades inside the proposed band, comparable outside-band activity, and no one ticker contributing a dominant share of the evidence. |

“Meaningful” is a calibration contract, not a single dollar amount: the
comparison must be materially worse both in aggregate and per affected trade,
and it must not disappear when one unusually large trade is removed. The first
implementation must document and test the exact numeric thresholds rather than
hiding them in model wording.

## Candidate settings and ranking

The engine evaluates sensible configurable settings, then selects only a
supported candidate. It does not ask AI to invent settings.

- **Trade / ticker limits:** factual candidate integer limits based on observed
  activity, bounded to understandable values and evaluated from the trade after
  that limit onward.
- **Cooldown:** a small approved ladder of wait periods, initially 5, 10, 15,
  30 and 60 minutes; exact timing is required.
- **Time cutoff:** selected candidate Eastern-time cutoffs from normal
  understandable intervals, evaluated only where the record has meaningful
  activity on both sides of the cutoff.
- **Loss streak:** integer completed-loss thresholds, such as two, three or
  four, evaluated only in unambiguous chronological sequences.
- **P/L limits and giveback:** exact candidate thresholds derived from the
  trader’s observed realized P/L points and displayed as rounded, ordinary
  money values. A proposed number must remain supported after a holdout check;
  it is never labelled an “ideal” limit.
- **Entry-price range:** initially an evidence/exploration result, not an
  automatic recommendation. A later approved contract may promote it only with
  ticker-diversified evidence and a clear trader-selected confirmation.

Each candidate receives a transparent internal evidence record: eligible days,
eligible trades/executions, trigger count, affected trade count, affected P/L,
comparison P/L, concentration, and stability check. Ranking favors repeated
coverage and stable effect over a large loss from one trade.

## Execution-pattern observations

A high number of executions is meaningful context, but it is not automatically
bad behavior. The detector may record these neutral, factual observations:

- unusually high entries/adds in a completed trade;
- repeated additions after the position’s average entry is underwater;
- repeated partial exits or scale-outs;
- many executions inside a short time span;
- rapid re-entry after a completed loss.

These observations can strengthen the explanation for an existing cooldown,
ticker-attempt, or daily-trade-limit recommendation. They do **not** create a
new “do not average down” or similar preset automatically. Any new execution
pattern rule needs its own product plan, user-facing definition, and automatic
evaluation contract before it can be suggested.

## Recommendation lifecycle and frequency

- Evaluation may refresh after relevant confirmed Journal facts change, but
  user-facing recommendation issuance is limited to one new recommendation in
  a rolling 28-day period per account.
- A clearly strong first recommendation may be issued as soon as the shared and
  candidate-specific gates are met; it does not wait for a monthly review.
- Active rules are never suggested. A paused rule may be offered only as a
  reminder of its own historical evidence, never as a new recommendation.
- A trader can **Add rule**, **Save for later**, or **Not for me**. Add rule
  opens the normal rule form with the evidence-supported value shown for review;
  it does not activate the rule until the trader confirms it.
- “Not for me” suppresses the same preset for at least 90 days. “Save for
  later” remains visible without repeated alerts. A new recommendation replaces
  neither decision without genuinely new, stronger evidence.
- Recommendations do not appear as recurring warnings, left-navigation badges,
  or forced weekly-review tasks.

## User experience

The primary home is a small **Rule ideas** section on Trading Rules, below the
trader’s active rules and above the preset library. It appears only when an
eligible recommendation exists.

Each card shows plain language:

- the rule to consider and suggested setting;
- what it would have stopped or changed, stated factually;
- affected trades and days, with a compact link to inspect the relevant trades;
- a short limitation when coverage is incomplete;
- Add rule, Save for later, and Not for me.

Example: “Across four trading days, trades after your fifth completed trade
totaled -$X. Those later trades were negative on three of those days. You may
want to test a five-trade daily limit.” It must not say the rule would have
guaranteed a better result.

AI Chat and AI Reviews may surface the same saved evidence when relevant. AI
must use the exact recommendation record, retain its limitation, and direct the
trader to the Rules page for the final choice. It cannot add a rule through
conversation without the standard visible confirmation.

## Persistence, services, and safety

A future Rules migration adds account-scoped immutable evidence and mutable
trader-decision records. Exact table names/numbers are set only at implementation:

- recommendation candidate/evidence snapshot with digest;
- issued recommendation lifecycle and evidence revision;
- trader disposition: added, saved for later, dismissed, expired;
- evaluation run receipt with privacy-safe counts and versioned calibration.

The recommendation service is deterministic and server-owned. It reads bounded
Journal fact sets, calculates candidates, persists evidence, and returns a
typed presentation model. AI only consumes approved saved records. No raw
statement data, private notes, provider credentials, or cross-account facts are
included in recommendation records.

## Verification and acceptance

Before implementation is accepted, focused proofs must cover:

- high-activity first-week eligibility and low-activity delayed eligibility;
- minimum day/trade/execution gates and rule-specific trigger gates;
- no recommendation from a single ticker/day/outlier trade;
- correct candidate settings for every supported existing preset;
- exact timezone, ordering, realized-P/L, Data Decisions, open-position, and
  manual/import reconciliation treatment;
- suppression, save-for-later, active-rule exclusion, and 28/90-day frequency
  controls;
- no AI-only recommendation, configuration, or Journal mutation;
- clear mobile/desktop Rules-page presentation and no recurring warning noise.

## Implementation order

1. Approve this plan and settle the exact calibration values against controlled
   fixture data.
2. Audit the current preset catalog and separately decide whether any formerly
   removed rules should return.
3. Build deterministic evidence/candidate services and focused proofs.
4. Add the Rule ideas persistence/lifecycle and Trading Rules presentation.
5. Add saved-evidence context to AI Chat and AI Reviews only after the Rules
   surface is verified.
