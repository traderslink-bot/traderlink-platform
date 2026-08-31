# Trade Analyzer Profit-Protection Presentation Plan

**Status:** Phase 1 source implementation complete; real-data owner review pending

**Progress:** [Trade Analyzer Profit-Protection Presentation Progress](trade-analyzer-profit-protection-presentation-progress.md)

**Related factual-outcome review:** [Single-Trade Factual Outcome Presentation Plan](single-trade-factual-outcome-presentation-plan.md)

## Goal and delivery order

This work is deliberately split into two owner-approved deliveries. The first
delivery is only the individual completed-trade analysis card in Trade Tracker.
It must be accurate, readable on mobile, and approved against real saved data
before the broader Trade Analyzer results page starts. The second delivery
organizes the retained evidence and long-term comparisons on the Trade Analyzer
results page; it must not reopen or dilute the accepted tracker-card contract.

| Delivery | What the trader sees | Start gate | Completion gate |
| --- | --- | --- | --- |
| 1. Trade Tracker outcome card | One direct conclusion about the completed trade, its concrete impact, and a **View more** control for evidence | This approved plan plus fact-by-fact proof and owner-approved responsive composition | Owner says the real-data card is 100% correct on desktop and mobile |
| 2. Trade Analyzer results page | Clear individual-trade evidence plus long-term behavior results, organized around protecting profit and capital | Delivery 1 is owner-approved | Owner approves the page against real saved data |

Phase 1 may calculate direct conclusions only from the already saved,
account-scoped Analyzer replay and canonical Journal allocations described
below. It does not request new market data, create schema, or alter Journal
facts.

## Product rule for the main card

The main Trade Tracker card tells the trader the conclusion first. It cannot
lead with engine labels, raw metric names, averages, or a technical chronology.
For example, the card must not open with `Unrealized P/L reached`, `Green-to-
Red`, `MFE`, `MAE`, or `You did not reduce before it turned red`.

Its visible summary is specifically about taking profit, protecting capital and
managing position risk. VWAP, EMA, volume, other indicators and candle patterns
remain lower supporting evidence behind **View more**. Their saved facts remain
available for truthful long-term cohort statistics; long-term usefulness does
not promote them into the first-level trader conclusion.

The card selects one profit-taking/risk-management story. It does not stack
several sentences that repeat the same reversal. Repeated green/red/recovery
crossings are not displayed because ordinary micro- and nano-cap movement can
cross breakeven many times without producing a useful conclusion.

A percentage spike is not enough. A profit opportunity qualifies only from
consecutive completed one-minute closes on the shares still open, using these
microcap-specific gates. The card selects the highest qualifying threshold:

| Unrealized return held | Consecutive completed closes required |
| --- | --- |
| 50% or more | 3 minutes |
| 30% or more | 5 minutes |
| 20% or more | 10 minutes |
| 15% or more | 15 minutes |

A 20% move lasting 15 seconds, or any isolated one-minute flash, remains in the
saved price path but creates no trader-facing conclusion. A losing or flat
finish qualifies after a sustained window. A still-profitable finish qualifies
only when its final return is no more than half of the selected threshold, so a
30% window followed by a 27% finish does not create unnecessary feedback. The
no-reduction shape is:

> This trade gave you an opportunity to take [threshold]% or more profit for
> [continuous minutes] continuous minutes. You did not take profit or reduce
> your position, and the trade finished with a [percent] result ($[money]).

An add is described only as occurring after the unrealized-profit high and
increasing the shares still exposed before the losing finish. It is never
described as causing the loss.

When every required fact is proven, a reduced-position conclusion has this
shape:

> You reduced [percentage] of your position, and the trade finished with a
> [percent] loss ($[money]).
> Based on your actual later exit prices, that reduction avoided an additional
> $[difference] loss. If those shares had remained open, your result would have
> been -$[counterfactual] instead of -$[actual].

The bracketed amounts are not placeholders to be filled by a guess. They are
shown only after a deterministic Journal-ledger/counterfactual calculation is
specified, proved against saved executions, and approved. Until then, this
outcome is unavailable rather than estimated.

**View more** contains the supporting Analyzer facts: actual fills, time and
price sequence, saved 30-minute post-exit observation, peak/open P/L path,
partial-exit events, first-red/final P/L, and the ordinary detailed Analyzer
cards. The main card does not repeat those raw values as a technical summary.

The complete conclusion is not limited to unrealized P/L. The opportunity
window measures unrealized profit on shares still open, then combines it with
actual realized profit from earlier partial exits, the actual completed-trade
result, any proved later-exit counterfactual, and the saved 30-minute final-exit
review. After a partial exit or add, the continuous-opportunity clock restarts
so a later opportunity on the changed open position is measured without
double-counting the shares already sold.

If neither the sustained-opportunity/risk rules nor the saved 30-minute exit
review produces a meaningful conclusion, the card says that no meaningful
profit-taking or risk-management conclusion was found and points to **View
more**. It does not force advice from ordinary volatility.

## Phase 1 — Trade Tracker card

### 1. Design and data-proof gate

Before application code changes, audit the account-scoped saved model for each
supported conclusion. Record the exact field, units, price/P/L basis,
eligibility, missing-data state, and whether it is already saved or requires a
new approved calculation. Do not treat a summary statistic as a substitute for
an execution-level fact.

| Card conclusion | Required saved facts | What is factual today | Gate before showing dollars |
| --- | --- | --- | --- |
| Final-exit follow-through | final exit price and direction; persisted post-exit path explicitly at 30 minutes | The persisted 30-minute favorable movement is available when its saved row exists | Final price plus saved movement may form the observed post-exit price; never use 5, 15, 60, latest, or a new quote |
| Sustained profit-taking opportunity | saved exact execution states, saved completed one-minute candles, direction, average entry on shares still open, realized partial-exit P/L, and final Journal result | Open-position unrealized dollars/return and earlier realized dollars are reconstructed separately from saved facts; consecutive completed-close duration is tested against the microcap gates above | Show only the highest qualifying threshold; losing/flat finishes qualify, while a profitable finish must end at no more than half that threshold. Gaps and position-size changes reset the run and brief spikes stay silent |
| Position reduction | exact partial execution plus position quantity immediately before and after it | Saved event snapshots identify a partial and its direct size reduction where quantities are valid | Percentage is named only when its denominator is the shares open immediately before that reduction; multiple reductions make the exact counterfactual unavailable in Phase 1 |
| Avoided additional loss / counterfactual total | partial execution quantity/price/time; all later actual exit fills and prices; actual final trade result; one consistent saved price-and-quantity basis | Not a raw saved Analyzer metric; it requires the approved quantity-conserving Journal-ledger comparison | The deterministic counterfactual must reconcile before wording or dollars appear; fee coverage does not gate this profit-protection conclusion |
| Held after peak | peak time/P&L and final-exit time/P&L | Saved path can support elapsed time and observed peak-to-final change where present | Phrase as an observed sequence, never as a claim that holding caused the outcome |
| Trade open path | first-entry saved excursion-until-flat favorable/adverse movement and final exit | The first-entry snapshot can support the maximum observed favorable and adverse per-share movement while the trade was open | Long/short direction stays explicit; no price path is shown when the saved excursion is unavailable |
| Added after the high point | saved count of adds after the saved high point | The path summary proves whether and how many adds occurred after that high point; it does not by itself prove that an add occurred before first red | State only the observed after-high sequence; it does not prove that adding caused the final result |

### 2. Counterfactual calculation contract

The avoided-loss sentence is useful only if its comparison is exact. It is not
derived from the peak P/L, first-red P/L, green-to-red cohort total, MFE/MAE,
or an average.

The later implementation must first document and obtain approval for all of
the following:

1. Identify the one saved partial reduction plus the exact quantity reduced.
   Do not depend on noisy first-green/first-red crossings. Multiple reductions
   return an unavailable comparison until an approved multi-reduction
   allocation is implemented.
2. Preserve the reduction's actual execution price and the actual later
   exit-fill sequence, quantities, prices, and timestamps.
3. Use the same saved price-and-quantity basis on the actual and
   counterfactual result. Fee coverage does not gate this profit-protection
   conclusion; existing fee evidence remains available in its current detailed
   display and is not folded into an invented hypothetical fee.
4. Calculate the alternate result only by keeping the identified reduced shares
   open and allocating them across the same later actual exit prices. Do not
   create a price, replace later fills, or use market candles as an exit.
5. Reconcile the actual result to the canonical Journal ledger before comparing
   it with the alternate result. If an allocation cannot conserve quantities,
   do not show the claim.
6. State the assumption plainly in **View more**: the reduced shares are
   assumed to remain open and be sold at the trade's actual later exit prices.

The calculation belongs in a narrowly scoped, account-isolated Journal-ledger
read contract only after this gate. It is a new approved calculation, not a
presentation-only formatting change.

### 2a. Field audit — 2026-08-30

The read-only audit confirmed these existing account-scoped facts:

- The Analyzer persists the final-exit post-exit rows by an explicit minute
  value. The card may select only the row whose value is `30`.
- Each persisted Analyzer event snapshot carries its event kind, sequence,
  executed time, price, quantity, reported fee, and the position quantity
  immediately before and after the event. This proves a particular partial
  reduction and its percentage when its before quantity is positive.
- The current analysis version retains its verified one-minute market-session
  candles in `level_analysis_market_session_candles`. Together with the saved
  event snapshots, those candles preserve the complete path needed for later
  long-term results without another market-data request or schema change.
- The persisted path summary carries peak, first-red and final calculated P/L,
  the relevant timestamps, and the count of partial exits before first red.
- The canonical Journal analytics allocation facts carry the current
  account-scoped execution quantity, allocated quantity, price, time, side,
  existing fee facts and allocation role. The repository verifies allocation
  conservation for each current execution. Existing fee coverage remains
  evidence; it is not a display gate for this profit-protection conclusion.

The audit also confirmed that no stored field currently means `avoided loss`,
`protected capital`, or `counterfactual result for this partial exit`. Those
amounts therefore remain unavailable until a new deterministic calculation uses
the exact allocations under the contract above.

### 2b. Retained path and long-term fact contract

Raw first-green, first-red and recovery timestamps remain saved evidence, but
they do not create card conclusions or the future meaningful-opportunity
denominator. Those individual crossings are too noisy for micro- and nano-cap
trades.

The microcap threshold-duration matrix is a single-trade feedback filter only;
it is not a long-term cohort definition. Long-term analysis uses the continuous
stored facts: peak open unrealized dollars/return, the full profit-duration
path, realized profit from partial exits, position changes, final
dollars/return, and exact later-exit counterfactual status. Long-term views may
group or compare those facts only under separately approved definitions and
must show their eligible sample counts.

### 3. Exact card states

The final copy is selected by saved facts, never by an optimistic fallback.

| State | Main-card behavior |
| --- | --- |
| Exact reduced-position counterfactual is proven | Show the three-sentence reduction, avoided-loss, and actual-vs-counterfactual result conclusion. |
| One eligible partial reduction is saved but the counterfactual is not proven | Do not show a dollar protected/avoided statement. Show the ordinary fact only if its final owner-approved sentence is precise, then offer **View more**. |
| Sustained opportunity with no reduction and a losing finish | Show one opportunity-duration sentence plus the final loss; do not add a second peak-to-final restatement. |
| Realized profit followed by another opportunity | State the profit already secured, then the separately qualified opportunity on the remaining shares and the final result. Never add the realized and unrealized amounts into one ambiguous number. |
| Observed recovery after red | State the peak, the fact that it turned red, and the final outcome only after the persisted path has all three points; do not imply that recovery was foreseeable. |
| Added after the high point | State the saved count in ordinary language as an observed risk-management behavior; do not create an avoided-loss number for it. |
| Final exit has a favorable 30-minute observation | State the exact final exit and observed 30-minute after-exit outcome; say whether price rose after a long sale or fell after a short cover. |
| Zero or adverse 30-minute observation | State the corresponding direction accurately, without calling it missed money. |
| No meaningful qualifying result | State that no meaningful profit-taking or risk-management conclusion was found, confirm the detailed data remains under **View more**, and do not force a lesson. |

### 4. Responsive composition and interaction

- The card stays directly below the existing Trade Tracker trade-analysis
  context, without removing charts, fills, or detailed Analyzer evidence.
- Desktop: one readable conclusion block, optional compact status line, and an
  obvious **View more** control. No dense metric grid before the conclusion.
- Mobile: conclusion appears first with natural line wrapping; **View more** is
  a full-width, reachable control; detailed facts open below it in a single
  vertical reading order.
- **View more** reveals evidence rather than navigating away unexpectedly. It
  includes a direct link to the full Trade Analyzer result once Phase 2 exists.
- Currency, money basis, trade direction, observation timing, and unavailable
  states remain explicit. A dollar amount never loses its basis or account
  scope.
- No title repeats a paragraph explaining the title. Labels say only what the
  section is.

### 5. Phase 1 implementation gate and review

After the owner approves the review-only composition and the fact map:

1. Implement only the selected saved/account-scoped read model and the Tracker
   presentation. Do not change market-data collection, Analyzer eligibility,
   Journal facts, routes, schema, migrations, or existing calculations unless
   the approved counterfactual contract explicitly requires its new isolated
   Journal-ledger calculation.
2. Preserve technical cards and evidence behind **View more**.
3. Update the relevant Help copy in the same slice so it explains the exact
   observation, the 30-minute window, and any counterfactual assumption.
4. Perform source/diff checks during design. Do not run a server, tests, build,
   migration, staging, or deployment until separately authorized.
5. Run a local real-data visual review only using an owner-approved existing
   configuration and launch procedure. Review one reduced-position outcome,
   one no-reduction/reversal outcome, one final-exit path, and unavailable
   states at desktop and mobile widths.
6. Stop Phase 1 until the owner says the card is 100% right. No results-page
   implementation begins early.

## Phase 2 — Trade Analyzer results page

Phase 2 starts only after the card itself is accepted. It turns the existing
Analyzer facts into readable long-term evidence, while retaining individual
trade proof and avoiding claims that a behavior caused an outcome.

### Page organization

1. **Profit-taking paths** — continuous peak return, profit duration, realized
   partial-exit profit, final result and position changes, without using the
   single-trade card thresholds as permanent long-term buckets.
2. **Scaling out** — observed reduction sizes, profit already realized, later
   qualifying opportunity on remaining shares, exact avoided-loss status and
   final outcomes. Show the precise denominator and separate multi-reduction
   trades until an approved aggregation rule exists.
3. **After final exit** — saved 30-minute final-exit follow-through, with
   long/short direction made plain and no 60-minute substitution.
4. **Holding through a reversal** — observed time from peak to final exit and
   peak-to-final movement/result; descriptive, not prescriptive.
   The persisted peak-to-red duration is retained for long-term giveback-speed
   analysis with an explicit eligible-trade denominator; it is not a required
   sentence in the individual Trade Tracker conclusion.
5. **Adding after peak** — observed paths where saved facts show size was added
   after a peak, with final outcomes and coverage.
6. **Entry heat and event follow-through** — saved adverse movement after entry
   or add and saved post-event path observations, clearly secondary evidence.
7. **Individual trades** — searchable, filterable evidence list and links
   back to the exact Trade Tracker replay. This is the durable proof behind
   every aggregate.

### Results-page rules

- Lead each section with a plain conclusion and its sample count, then offer
  the detailed table/chart. Do not let average movement replace a specific
  trade result.
- Define every population and denominator. `N/A` is preferable to a rate that
  silently includes ineligible or incomplete trades.
- Keep currencies and gross/net bases separate. Never combine cross-currency
  results.
- Treat every comparison as historical observation. Do not say scaling,
  holding, indicators, or patterns caused, prevented, protected, or guaranteed
  an outcome unless an approved counterfactual definition supports that exact
  claim.
- The results page consumes the same field definitions accepted for the card;
  it does not recompute a different version of the story.
- First-green-to-first-red, first-red-to-first-recovery, and peak-to-first-red
  timing remain distinct facts. Do not merge their populations or describe one
  interval as another.

## Candidate implementation surfaces after approval

These are discovery candidates, not an authorization to edit them now:

- Daily Trade Analyzer shared contract for the exact card outcome shape.
- A new narrowly scoped Journal profit-protection outcome service that consumes
  existing current allocation facts and the saved Analyzer path; it is read-only
  and does not alter Journal facts.
- The existing account-scoped Analyzer-detail route, Day Session types, and
  Day Session view.
- Trade Analyzer Help content and the relevant migration plan/progress records.

Any changed-file allowlist is proposed and approved immediately before each
implementation slice. Existing committed presentation work remains intact.

## Acceptance record

### Phase 1: Trade Tracker card

- [ ] Owner approves this detailed plan and the revised review-only composition.
- [ ] Every displayed sentence has a field-level fact map and unavailable rule.
- [ ] Any avoided-loss/counterfactual number has an approved ledger allocation,
  quantity-conserving calculation, and matching gross-before-fees basis.
- [ ] Owner approves real saved-data rendering on desktop and mobile.
- [ ] Owner says the Tracker card is complete before Phase 2 starts.

### Phase 2: Trade Analyzer results page

- [ ] Owner approves the results-page composition before source changes.
- [ ] Long-term sections use the accepted card definitions and stated samples.
- [ ] Individual-trade proof, unavailable states, and Help remain accessible.
- [ ] Owner approves real saved-data rendering on desktop and mobile.
