# Single-Trade Factual Outcome Presentation Plan

**Status:** Local source implemented; real-data owner review pending

**Related plan:** [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md)

**Progress:** [Single-Trade Factual Outcome Presentation Progress](single-trade-factual-outcome-presentation-progress.md)

**Controlling delivery sequence:** [Trade Analyzer Profit-Protection
Presentation Plan](trade-analyzer-profit-protection-presentation-plan.md)
controls the card-first owner-approval gate and the later results-page work.

## Purpose

Present a completed trade's saved Analyzer outcome in direct, ordinary trading
language. The card must distinguish a factual observation from a market-data
prediction, and must not replace individual trade facts with averages.

## Saved-fact mapping

| Card fact | Existing saved source | Eligibility for copy |
| --- | --- | --- |
| Final-exit price | `snapshot_json.event.priceDecimal` from the final-exit event snapshot | A current ready analysis has a final-exit event with a valid saved price. |
| 30-minute final-exit movement | `journal_round_trip_daily_trade_analysis_post_exit_paths.favorable_move_decimal` where `minutes_after_exit = 30` | The persisted 30-minute row exists and its movement is non-null. Never substitute a 5-, 15-, 60-minute, latest, or new market value. |
| Open-position opportunity | Saved event sequence, average entry and quantity after each event, direction, and saved completed one-minute closes | Calculate unrealized dollars/return on shares still open. Qualify only consecutive completed closes under the microcap matrix: 50%/3 minutes, 30%/5, 20%/10, or 15%/15. Select only the highest qualifying tier. |
| Realized profit before another opportunity | Saved partial-exit price/quantity plus the average entry immediately before the reduction | Calculate partial-exit realized P/L separately. Reset the opportunity run after the reduction and show the realized amount only when it is positive and precedes a later qualifying window on the remaining shares. |
| One partial reduction percentage | `positionQuantityBeforeDecimal` and `positionQuantityAfterDecimal` in a saved partial-exit event snapshot | Both quantities are valid and the before quantity is greater than zero. The factual percentage is the shares reduced from the position open immediately before that exit, not an undefined percentage of the whole trade. |
| First-red P/L | `first_red_pnl_decimal` in the same path summary | The current saved path has a green-to-red status and a non-null first-red P/L. |
| Raw Green-to-Red crossing timing | `firstGreenAtUtcSeconds`, `firstRedAtUtcSeconds`, and optional `firstRecoveryAtUtcSeconds` from the current saved path | Retain as detailed historical evidence only. Individual crossings do not create a card conclusion or meaningful-opportunity cohort because microcap trades can cross breakeven repeatedly. |
| Final P/L | `final_pnl_decimal` in the same path summary | The current saved path has a non-null final P/L. |
| Avoided-loss comparison | Current accepted Journal execution allocations plus one saved partial exit | Every allocation is current and accepted, quantities conserve exactly, prices exist, there is one reduction, and its shares can be carried through actual later exits without an intervening add or flip. It does not depend on a noisy first-red boundary. |

The final-exit price together with the stored directional movement may format
the 30-minute price. That presentation uses only those two saved facts; it does
not request data or calculate a new candle outcome.

A negative or flat completed result may use a qualifying sustained-opportunity
statement. A positive completed result uses it only when final return is no
more than half of the selected threshold. This retains substantial giveback
feedback without producing commentary for a trade that sustained 30% and
finished at 27%.

## Copy contract

### Final exit

- **Positive long movement:** `You fully exited at $X. Price reached $Y within 30 minutes. You left $Z/share on the table.`
- **Positive short movement:** use the same structure when price fell after the
  cover; the direction must remain explicit.
- **Zero long movement:** `You fully exited at $X. Price did not rise above your
  exit price within 30 minutes.`
- **Zero short movement:** `You fully exited at $X. Price did not fall below your
  exit price within 30 minutes.`
- **Negative long movement:** `You fully exited at $X. During the first 30
  minutes, price stayed below your exit price.`
- **Negative short movement:** `You fully exited at $X. During the first 30
  minutes, price stayed above your exit price.`
- **Unavailable:** `The 30-minute post-exit observation is unavailable for this
  trade.`

### Green-to-red and reduction

Raw phrases such as `Unrealized P/L reached` and `You did not reduce before it
turned red` are evidence labels, not main-card copy. The controlling
profit-protection plan requires the main card to show only a direct conclusion
and impact, with raw path facts behind **View more**. A specific avoided-loss
or actual-vs-counterfactual dollar conclusion appears only when the approved
Journal-ledger allocation proves it from actual later exits; otherwise the card
states that the exact comparison is unavailable.

## Explicit exclusions

- Do not claim exact realized P/L or return for one partial exit. The Analyzer
  has the partial event's saved price and quantity but does not currently carry
  an approved Journal-ledger allocation for that sentence.
- Do not use average, median, win-rate, total, or cohort wording in this card.
- Do not add calculations, market-data requests, schema changes, migrations,
  synthetic prices, or data fallback behavior.
- Do not claim that reducing size avoided a stated dollar amount unless the
  approved Journal-ledger calculation proves the exact reduced quantity and
  later-exit comparison. Never substitute a raw Analyzer metric.

## Approved follow-on: long-term behavior statistics

After the owner approves the individual-trade card against real saved data, the
long-term Green-to-Red experience will prioritize these saved-fact questions:

1. **Profit-taking paths:** peak open dollars/return, continuous profit
   duration and final results, analyzed as continuous facts rather than the
   single-trade card's fixed feedback thresholds.
2. **Scale-out behavior:** reduction percentage, realized profit secured, later
   qualifying opportunity on remaining shares, and observed final outcome.
3. **Final-exit follow-through:** how often price continued in the trade's
   favorable direction during the first saved 30 minutes after final exit, and
   how often the exit instead avoided a reversal.
4. **Holding through reversals:** time held from recorded unrealized-profit peak
   to final exit, and the recorded peak-to-final reversal.
   The separately persisted peak-to-red duration may measure long-term
   giveback speed, but it is not shown as a main-card sentence.
5. **Adding after peak:** the saved count of trades where size was added after
   the recorded profit peak and their observed final outcomes.
6. **Entry heat:** measured adverse movement after entry or add until the
   position was flat, presented as observation rather than a stop-loss rule.
7. **Follow-through after a partial exit or add:** existing saved post-event
   paths show whether price later moved in the trade or opposite direction.

Raw Green-to-Red crossing timestamps remain available as detailed historical
evidence. Long-term profit-taking statistics use continuous peak, duration,
realized profit, open-position opportunity, final-result and proved avoided-
loss facts. The single-trade threshold-duration matrix is not a long-term
population definition.

VWAP, EMA, volume, RSI, MACD and candle-pattern facts remain available as
secondary evidence rather than first-level profit-protection conclusions. All
long-term comparisons remain observational: they must not say that reducing,
adding, holding, an indicator or a pattern caused, prevented, protected or
guaranteed an outcome.

## Review composition

The review composition keeps one concise outcome card above optional technical
evidence. It shows the final-exit statement first, then the applicable
green-to-red statement. Existing chart replay, fills, indicators, patterns and
coverage states remain detailed evidence below rather than competing with the
outcome.

## Approval gates

1. Owner approves the direct factual copy and responsive composition.
2. Implementation maps only the listed existing saved facts.
3. Owner reviews real saved data in the application before acceptance.
