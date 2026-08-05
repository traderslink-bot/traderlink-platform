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

## Catalog audit and candidate future presets

This is a planning audit of the native preset catalog and its evaluator. It is
not authorization to restore a formerly removed template, add a new template,
or change a trader's current Rules. Every automatic rule and every future Rule
idea must remain deterministic, based on confirmed selected-account Journal
facts, and must report **N/A** where its required facts are not available.

### A. Current presets: ready from existing confirmed trade facts

The following ten native templates already have a deterministic evaluation
definition. They operate on ready-closed, non-Swing Day trades in account-time
order. Their eventual recommendation evidence can therefore be computed from
the same confirmed facts, while the recommendation service itself remains a
separate read-only feature.

| Current preset | Exact facts already used | Recommendation value and false-positive guard |
| --- | --- | --- |
| Avoid an entry-price range | Weighted-average entry price, trade currency, completed outcome | Technically evaluable, but do not recommend a generic dollar range. Require enough within-band and outside-band trades, several tickers, and no dominant ticker. Treat as exploration-only until its price-band contract is approved. |
| Cooldown after a loss | Earlier completed trade's exact exit time and realized P/L; later exact entry time | Strong candidate for repeated rapid loss re-entry. Require exact times, several separate days, and an outcome comparison against longer breaks. Do not equate a short break with a lack of a genuine setup. |
| Maximum ticker attempts per day | Stable instrument, flat-to-flat attempt order, local trading date | Strong candidate for repeated same-ticker attempts. Require later attempts across several days; one unusually active ticker-day is insufficient. |
| Maximum completed trades per day | Completed Day-trade order and local trading date | Strong candidate for overall overtrading. Compare later trades with earlier trades on the same affected days and prevent one large loss from deciding the result. |
| No new trades after a selected time | Exact entry timestamp and account timezone | Strong candidate only when there is meaningful activity both before and after a proposed cutoff across multiple days. A late-trade loss alone is not evidence. |
| Stop after consecutive losses | Exact chronological completed outcomes and realized P/L | Strong candidate if multiple loss-streak events are followed by additional losing activity. Same-time/ambiguous order or missing P/L produces N/A for the affected event. |
| Stop after a daily realized loss limit | Ordered realized daily P/L | Strong candidate if continuing after repeated realized-loss thresholds deepens losses. Do not derive the threshold from one extreme day. |
| Stop a ticker after losing attempts | Instrument, completed attempt order, realized P/L | Strong candidate for repeated losing re-attempts in a ticker. Require independent ticker-day sequences; a single ticker's event must not dominate. |
| Stop after a realized profit giveback | Ordered realized daily P/L and daily realized peak | Strong candidate if later trades repeatedly turn a realized gain into a deeper giveback. It does not measure unrealized peak profit. |
| Stop after a daily realized gain limit | Ordered realized daily P/L | Strong candidate if further trades repeatedly erode gains after a realized threshold. It must not label the selected value an ideal gain limit. |

The current evaluator correctly treats only the trade **after** a configured
stop threshold as a possible violation. The trade that reaches a loss, gain,
streak, or giveback threshold is evidence for the setting; it is not itself a
broken-rule event.

### B. Candidate presets ready from current round-trip facts

These are technically calculable now from confirmed closed Day-trade facts,
but are **not** in the catalog. Each needs an owner-approved trader-facing
definition, configuration contract, and complete evaluation/recommendation
tests before it can appear in Rules or AI.

| Candidate preset | Deterministic rule definition | Required existing facts | Main risk and required guard |
| --- | --- | --- | --- |
| Cooldown before re-entering the same ticker | After a completed flat-to-flat trade in a ticker, do not begin a new attempt in that ticker for the selected number of minutes, regardless of the prior result. | Instrument identity, exact exit and next entry timestamps, local date | A planned re-entry may be valid. Suggest only when short same-ticker gaps repeatedly underperform longer gaps; never describe it as a setup-quality finding. |
| Stop after a selected total number of losing trades in a day | Once the configured count of completed losses is reached, later Day-trade entries are broken even if wins interrupted the losses. | Chronological completed outcomes, local date, realized P/L | This is different from consecutive losses. It needs several threshold-reaching days and later trades, or it becomes a one-day reaction. |
| No new Day trades before a selected time | A Day-trade entry at or before the configured local time is broken. | Exact entry timestamp and account timezone | Early trading may be a deliberate strategy. It can only be suggested after several days with comparable activity before and after a potential start time. |
| Maximum Day-trade hold time | A completed Day trade held longer than the configured duration is broken. | Exact opening/closing timestamps, Day-trade classification | A longer hold is not inherently poor and could describe a valid strategy. Only consider this if a trader explicitly wants a time-management rule; do not make an automatic first recommendation. |

These candidates use the existing confirmed round-trip projection and do not
need a new ledger field. Their implementation must still use a server-owned
cross-day fact reader rather than trying to combine browser cards or display
values.

### C. Candidate presets that require a new deterministic execution-derived fact

The accepted Journal fact set preserves allocation roles and ordered execution
evidence, but the current daily Rule evaluator intentionally receives a
round-trip summary only. The following are feasible only after a new
server-derived, versioned execution-pattern fact is defined. It must be
recomputed from accepted allocation sequence on every affected rebuild and
never be inferred in the browser or by AI.

| Candidate preset | Derived fact required | What can be measured safely | False-positive risk and rule boundary |
| --- | --- | --- | --- |
| Maximum entries or adds per trade | Count opening and adding allocations, ordered by allocation sequence | Number of position-increasing executions within one completed trade | Multiple fills may be broker execution mechanics, not intentional scaling. Count unique accepted executions and expose it as an execution limit, not a judgment about skill. |
| Maximum total executions per trade | Count unique accepted executions allocated to a completed trade | Total order/fill density across entries, adds, reductions and close | A high count can be legitimate partial-fill execution. It is a potential process limit, never an automatic claim of overtrading by itself. |
| Maximum executions in a short interval | Timestamped allocation sequence plus rolling interval count | Execution burst density during a trade or trading day | Needs exact times and a bounded rolling-window definition. It cannot tell whether a rapid sequence was a valid fast market response. |
| Avoid adding to a losing position | For each adding allocation, running pre-add position, weighted entry price, allocation price and direction | Whether the add price was adverse to the existing long/short average entry at that moment | This is a factual price relationship, not proof of poor risk management. Do not call it “averaging down” in a recommendation until the user-facing definition is approved. |
| Maximum adverse adds per trade | The same running-price relation plus count of adverse adds | Repeated adds while the position is underwater | Must distinguish actual additional exposure from a correction, flip, or allocation artifact. Requires complete price/quantity/order facts for every applicable allocation. |
| Maximum partial exits per trade | Count reducing allocations before final close | Scale-out count and sequence | Scaling out is often intentional. This must never be suggested solely because there are many partial exits; any future recommendation needs repeated outcome evidence and a user-approved strategy boundary. |
| Daily execution limit | Account-local ordered accepted execution count across all Day trades | Total buy/sell execution density per trading day | It must not double-count allocations, use unresolved rows, or label ordinary broker partial fills as separate discretionary trades without a plainly stated execution-based rule. |
| Rapid same-ticker re-entry after a partial exit | Ordered allocation/trade boundaries, exact times, position state | Whether the trader fully exited, then reopened the same ticker shortly after a scale-out/close sequence | Must not confuse an add or a still-open position with a true new flat-to-flat attempt. |

For all Section C candidates, the proposed derived record must include at
least: round-trip identity/version, accepted execution identities/versions,
ordered allocation roles, timestamps, quantities, prices where required,
running position before and after each allocation, and a digest of the input
set. Missing price, ambiguous ordering, unresolved Data Decisions, or an
incomplete chain makes only the dependent observation N/A.

The first execution-pattern release should begin with neutral evidence cards
for **entries/adds per trade**, **total executions per trade**, and **rapid
same-ticker re-entry**. It should not immediately create restrictive presets.
That lets TraderLink verify that the derived facts distinguish genuine
scale-in/out behavior from broker partial fills before a Rule idea tells a
trader to change behavior.

### D. Patterns that must not be automatic from executions alone

The following may be useful coaching topics, but Journal executions cannot
prove them. They remain unavailable for automatic Rules and automatic rule
recommendations until an explicit, separately governed data source exists.

| Topic | Missing required evidence |
| --- | --- |
| Wait for a genuine setup, breakout, pullback, reversal, catalyst, or chart pattern | Trader-authored tags/notes and/or verified market/candle data; executions only show what happened, not why. |
| Chasing, early entry, poor fill, FOMO, anxiety, discipline, hesitation or revenge trading | Reliable trader-authored tag/note evidence. A short re-entry interval is factual context, not an emotion diagnosis. |
| RSI, EMA, VWAP, candle type, support/resistance, volume, float, news, premarket strength or regular-session liquidity rules | Complete, timestamp-aligned market data and an approved indicator/candle contract. |
| Risk/reward, stop-loss adherence, position-risk cap, buying-power or portfolio-exposure limit | A saved planned stop/target, account equity/buying power, and complete simultaneous-position facts. Execution P/L is not a planned-risk measure. |
| Trade only a selected direction | Technically simple from the stored long/short direction, but it is a formerly removed preset. It remains unavailable until the owner explicitly restores it and defines whether it applies by trade direction, ticker, or day. |
| Skip the next trade after an outcome | Technically sequenceable from completed outcomes and later entries, but it is a formerly removed preset. It remains unavailable until an explicit restoration decision and a precise outcome/configuration contract. |
| Reduce the next trade to half size after a loss | Requires a formally selected size basis (maximum position quantity, entry notional, or another account/currency-aware measure) and is a formerly removed preset. It remains unavailable without explicit owner restoration and a new derived-size contract. |

### Evidence ranking: what “would have been helpful” means

The detector may compare candidates such as: one Rule would have stopped one
later trade, another two, and another fifteen. Count alone is not enough. A
candidate can be ranked only when all of these are true:

1. **Trigger:** The selected candidate setting was reached from confirmed
   chronological facts before the later trade began.
2. **Affected set:** The rule would have marked those later trades Broken under
   its exact stated definition. It does not rewrite, remove, or assume a
   different outcome for them.
3. **Result:** The affected trades have a materially weaker combined and
   per-trade realized result than an appropriate same-account comparison set.
4. **Repeatability:** The affected pattern appears on the rule's required
   separate trading days and remains directionally consistent when a single
   outsized trade is removed.
5. **Concentration:** One ticker, one day, or one fill-heavy trade cannot
   supply a dominant share of the evidence.
6. **Coverage:** All facts that rule depends on are confirmed. A missing exact
   time, P/L, price, allocation sequence, or resolved decision excludes only
   that event from the candidate; it never becomes a guessed negative result.

The evidence card may say, for example, that a five-trade daily limit would
have applied to fifteen later completed trades across five days, and state the
actual combined result of those fifteen trades. It must not say that avoiding
them would have guaranteed a better week. The numeric candidate setting is a
testable starting point, not an “ideal” setting or a command.

### Calibration and issuance controls

- The shared first-week gate remains a minimum, not a waiting period: three
  active days, 20 confirmed completed Day trades, and 50 accepted execution
  events can support a high-activity new trader. A lower-activity account waits
  until it has enough rule-specific evidence.
- Candidate thresholds are tested from a small, documented ladder. For example,
  trade/attempt limits use observed whole-number boundaries; cooldowns use
  approved minute values; loss/gain/giveback limits use reproducible realized
  P/L candidates. AI must never invent a threshold.
- The service records both the result for trades the candidate would have
  stopped and the comparison population. It should favor broad, repeated
  impact over the largest dollar loss.
- The system may surface a clearly supported first Rule idea after one active
  week. It may issue at most one new idea in 28 days, never activates a rule,
  and observes the existing dismissal/save-for-later controls.
- A later evaluation can refresh the private evidence snapshot but cannot turn
  a muted idea into an alert unless the existing lifecycle and materially
  stronger-evidence conditions are met.

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
