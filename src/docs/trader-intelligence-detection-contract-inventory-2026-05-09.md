# Trader Intelligence Detection Contract Inventory

Last updated: 2026-05-10

## Purpose

Inventory behavior labels and raw IDs that can currently reach user-facing
Trader Intelligence UI. This file supports the active detection and language
hardening plan:

- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`

The product rule is strict: a behavior can drive a primary user-facing
conclusion only when it has a product-facing contract, evidence requirements,
negative guards, beginner-readable language, and tests.

## Current Audit Scope

Audited first for the expanded implementation run:

- `src/lib/trader-analytics/product/product-intelligence.ts`
- `src/lib/trader-analytics/product/coach-action-loop.ts`
- `src/lib/trader-analytics/product/coach-overall-focus.ts`
- `src/lib/user-facing-review/mappers/build-user-facing-trade-review-summary.ts`
- `app/coach/page.tsx`
- core route labels found by `rg` across `app` and `src/lib`

The first implementation slices now wire the shared mapper and safe state copy
through the core routes. Future audits should focus on newly introduced
behavior families, route regressions, or places where a new certified behavior
needs a product-facing contract before it drives primary UI.

## Evidence Model Reminder

Use `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md` when
adding or certifying any behavior.

Every behavior should declare:

- whether it is a risk to reduce, strength to repeat, review prompt, or
  internal-only signal,
- whether it is based on execution evidence, market-context evidence, or both,
- which evidence is missing when it must fall back to a review prompt.

Execution evidence comes from CSV buys/sells and saved trade reconstruction.
Market context evidence comes from support/resistance levels, candles, volume,
and the chart windows before entry, during the trade, and after exit.

## Inventory

| behaviorIdOrRawLabel | sourceFiles | currentUserFacingSurfaces | proposedState | requiredEvidence | availableEvidence | missingEvidence | negativeGuards | minimumSafeRouteState | allowedRoutes | defaultUserLabel | fallbackOrReviewPromptCopy | testsNeeded | implementationOwnerFiles |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `added_after_failed_premise` / "Added After Failed Premise" | `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` focus, severity, session prep, confidence copy, rule ideas | certified_detection | ordered executions, at least three adds after initial entry, no meaningful reduction before those adds | add count and reduction count from saved execution summaries | candle proof that the trade idea itself failed | Do not say "failed premise" or claim the setup failed from execution-only data. Do not call it revenge. | execution-only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Added several times before reducing size | Review the add sequence and mark where size should have stopped increasing. | positive add-before-reduction case, no-add negative case, route copy safety | `src/lib/user-facing-behavior/...`, `coach-action-loop.ts` |
| `scaled_loser` / "Scaled Losing Position" | `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` review prompts, rule/streak context, analytics/progress behavior copy | review_prompt | ordered executions, add after trade moved against position | `adversePriceAddCount`, risk IDs | candle structure after add; support/repair evidence; whether the trade kept weakening | Do not say the trader averaged down unless below-basis evidence is available. Do not say the add was bad from execution-only evidence. | execution-only prompt only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Review adds that need chart context | Check whether each add was a planned dip buy, a repaired trade, or only increased exposure. | adverse-add stays prompt without chart context; chart-backed weak-add positive handled by `adds_increased_risk_into_weakness`; constructive add handled by `adds_aligned_with_strength` | `src/lib/user-facing-behavior/...`, `coach-action-loop.ts`, analytics report tests |
| `add_after_adverse_move` / "Added After Adverse Move" | `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` review prompts, rule/streak context, analytics/progress behavior copy | review_prompt | ordered executions, adverse move before add | `adversePriceAddCount`, risk IDs | candle/level context for quality of add | Do not call it weakness unless price/candle evidence shows weakness. Do not label planned dip buys as mistakes when support held or structure repaired. | execution-only prompt only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Review adds that need chart context | Check whether the trade repaired before the add or kept weakening after it. | adverse-move prompt positive; chart-confirmed weak-add risk; support/reclaim constructive-add strength | `src/lib/user-facing-behavior/...`, `coach-action-loop.ts`, saved-thread/chart-context tests |
| adverse-add / dip-buy ambiguity | `rule-tracker.ts`, `product-expansion.ts`, `execution-feedback`, chart-context findings | `/coach` fix-first rules, streaks, analytics/progress behavior copy | review_prompt until chart context proves direction | ordered executions, add price versus average entry, candles/levels after add, support/resistance, volume when making volume claim | execution-only adverse add count and product-safe chart-context findings | explicit repaired-trade or failed-dip classification | Do not tell the trader the add was bad from execution-only adverse movement. Do not label a planned dip buy as a mistake when support held or structure repaired. | execution-only for review prompt; market-context/combined for certified conclusion | `/coach`, `/review`, `/analytics`, `/progress`, `/trades/[tradeId]` | Review add quality after price moved against the trade | Check whether the add was a planned dip buy with repair evidence or only increased exposure while the trade kept weakening. | adverse add with no chart context stays prompt; support-hold/reclaim becomes constructive review; continued fade/no repair becomes certified risk | `src/lib/user-facing-behavior/...`, `src/lib/trader-analytics/product/rule-tracker.ts`, saved-thread/chart-context bridge tests |
| `overbuilt_losing_position` / "Overbuilt Losing Position" | `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` severity, archetype, rule recommendations | certified_detection | gross losing trade, size expansion or overbuilt risk ID | gross P/L, add count, risk IDs | exact avoidable-loss calculation | Do not imply exact alternate P/L or guaranteed avoidable loss. | execution-only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Built too much size in a losing trade | Review where size should have stopped increasing. | losing-overbuilt positive and winner negative | `src/lib/user-facing-behavior/...`, `coach-action-loop.ts` |
| `poor_first_reduction` / "Poor First Reduction" | `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` severity, session prep, rule ideas | certified_detection | first reduction was too small to materially reduce risk | `small_first_risk_reduction` risk ID | open-profit path before reduction | Do not say profit was available unless profit context exists. | execution-only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | First reduction did not take much risk off | Replay the first reduction and decide what size would have protected the trade better. | small-reduction positive and meaningful-reduction negative | `src/lib/user-facing-behavior/...`, `coach-action-loop.ts` |
| `left_open_position` / "Left Open Position" | `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` severity, open-trade review, session prep | certified_detection | execution sequence ended with remaining shares | open position flag, final position size | later broker executions after import window | Do not treat as closed-trade performance review. | execution-only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Trade was left open | Wait for closing execution or mark the position as still open before judging the full trade. | open positive and flat negative | `src/lib/user-facing-behavior/...`, `coach-action-loop.ts` |
| `overtraded_same_ticker` / "Overtraded Same Ticker" | `product-intelligence.ts`, `coach-action-loop.ts`, `saved-trade-threads.ts` | `/coach` severity, recurrence, ticker-story review | certified_detection | same symbol appears repeatedly with risky or losing outcomes | same-symbol rows, trade IDs, P/L, top risk | volume/level context across attempts | Do not claim emotional intent. Use "same ticker attempts," not "revenge," unless separate revenge evidence exists. | thread-level evidence available | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Repeated risky trades on one ticker | Compare the same-symbol replays and decide whether a cooldown rule is needed. | same-symbol repeat positive and one-off negative | `src/lib/user-facing-behavior/...`, `coach-action-loop.ts` |
| `profit_giveback` ticker story | `saved-trade-threads.ts`, route ticker-story panels | `/coach`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` ticker-story context | certified_detection | same-symbol same-day thread, positive cumulative P/L peak, later round trips, lower final cumulative P/L | round trips, P/L by round trip, peak cumulative P/L, giveback from peak | volume/level reason for why the later attempt changed | Do not call losing-only threads profit giveback. Do not claim volume faded or setup changed unless market context supports it. | thread-level evidence available | `/coach`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Re-entry gave back profit | Compare the later entry against the first winning push and check whether the setup was still fresh. | positive peak with later giveback, repeated losing attempts negative guard | `saved-trade-threads.ts`, route ticker-story panels |
| `repeated_losing_attempts` ticker story | `saved-trade-threads.ts`, route ticker-story panels | `/coach`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` ticker-story context | certified_detection | same-symbol same-day thread, multiple closed round trips, total thread P/L below zero, no positive P/L peak required | round trips, P/L by round trip, total gross P/L | chart/volume context for whether later attempts degraded | Do not call it profit giveback when no profit peak existed. Do not call it revenge as fact. | thread-level evidence available | `/coach`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Repeated attempts lost money | Review whether later attempts happened after the setup or volume had faded. | multiple losing attempts positive, profit-giveback negative guard | `saved-trade-threads.ts`, route ticker-story panels |
| `day_trade_turned_swing` ticker story | `saved-trade-threads.ts`, saved report rows | `/coach`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` ticker-story context | certified_detection | same-symbol thread or trade row crosses session date, held overnight, or remains open beyond intended intraday scope | session date, execution timestamps, held-overnight flag, open status | user intent or original plan unless saved review answers exist | Do not say it was wrong to swing. Ask whether a separate hold plan existed. | thread-level evidence available | `/coach`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Re-entry changed the trade type | Write down the hold plan, invalidation, size, and why the day-trade idea became worth carrying. | overnight/swing positive, same-day flat negative | `saved-trade-threads.ts`, route ticker-story panels |
| `open_reentry` ticker story | `saved-trade-threads.ts`, saved report rows | `/coach`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` ticker-story context | certified_detection | same-symbol re-entry exists and imported executions do not show position returning to flat | open-position flag, final position size, round trips | later executions after import window | Do not judge the full re-entry until closing execution exists. | thread-level evidence available | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Re-entry is still open | Review completed execution evidence now and wait for a closing execution before judging the full re-entry. | open re-entry positive, closed round trip negative | `saved-trade-threads.ts`, route ticker-story panels |
| `green_to_red_session` session story | `saved-trade-threads.ts`, route session-story panels | `/coach`, `/analytics`, `/progress`, `/trades` session-story context | certified_detection | session has saved round trips in time order, positive cumulative P/L peak, final session P/L below zero | round trips, timestamps, gross realized P/L, cumulative peak, final P/L, giveback from peak | chart/volume reason for why later trades failed | Do not claim revenge, volume fade, or support/resistance failure from execution-only data. | session-level execution evidence available | `/coach`, `/analytics`, `/progress`, `/trades` | Green-to-red session | Find the trade or re-entry that changed the day and write what should have stopped the next attempt. | positive peak then red finish, losing-only negative guard | `saved-trade-threads.ts`, route session-story panels |
| `same_symbol_many_attempts` session story | `saved-trade-threads.ts`, route session-story panels | `/coach`, `/analytics`, `/progress`, `/trades` session-story context | certified_detection | one same-symbol thread has repeated round trips, repeated losses, or profit giveback | same-symbol thread, round-trip count, P/L by ticker story | market context across attempts | Do not call it revenge or emotional trading as fact. Use same-symbol attempt language. | session-level execution evidence available | `/coach`, `/analytics`, `/progress`, `/trades` | Many attempts on one ticker | Compare the first entry with each later re-entry and mark which ones had a fresh reason. | three-attempt positive, one-off negative | `saved-trade-threads.ts`, route session-story panels |
| `session_high_trade_count` session story | `saved-trade-threads.ts`, route session-story panels | `/coach`, `/analytics`, `/progress`, `/trades` session-story context | certified_detection | session has at least eight round trips or at least five symbols | trade count, symbol count, saved execution timestamps | user plan, fatigue state, chart context | Do not say every high-count session is bad. Present it as a review target. | session-level execution evidence available | `/coach`, `/analytics`, `/progress`, `/trades` | High trade-count session | Check whether each trade had its own plan or whether activity increased after the first loss. | high-count positive, normal-count negative | `saved-trade-threads.ts`, route session-story panels |
| `open_or_swing_review` session story | `saved-trade-threads.ts`, route session-story panels | `/coach`, `/analytics`, `/progress`, `/trades` session-story context | certified_detection | at least one ticker story stayed open or carried overnight | open-position flag, held-overnight flag, crossed session date | original user plan | Do not say the hold was wrong without plan/context. Ask for hold-plan review. | session-level execution evidence available | `/coach`, `/analytics`, `/progress`, `/trades` | Open or swing exposure to review | Review hold plan, size, and invalidation separately from the original intraday idea. | open/overnight positive, same-day flat negative | `saved-trade-threads.ts`, route session-story panels |
| `positive_controlled_session` session story | `saved-trade-threads.ts`, route session-story panels | `/coach`, `/analytics`, `/progress`, `/trades` session-story context | certified_detection | session finishes positive without higher-priority risk story | saved round trips, final session P/L, trade count | chart context for whether exits were ideal | Do not imply future performance or that every trade was good. Treat as strength-to-repeat review. | session-level execution evidence available | `/coach`, `/analytics`, `/progress`, `/trades` | Positive session to repeat | Identify what was controlled enough to repeat, especially entries, reductions, and final exits. | positive session positive, risk-story priority guard | `saved-trade-threads.ts`, route session-story panels |
| `chased_entry` / "Chased Entry" | `product-intelligence.ts`, `coach-action-loop.ts`, user-facing review mapper | `/coach` severity, archetype, trade detail review copy | review_prompt | first entry timestamp, recent extension, candle window, ideally levels/volume | rapid execution clustering and sometimes pattern IDs | candle extension and level distance | Do not call it chasing from execution clustering alone. | chart-context available for certified claim; execution-only for prompt | `/coach`, `/review`, `/analytics`, `/trades/[tradeId]` | Review whether the entry was rushed | Check whether the entry came after the easy part of the move was already gone. | prompt fallback, chart-context positive later | `src/lib/user-facing-behavior/...`, user-facing review mapper later |
| `revenge_reentry_cluster` / "Revenge-Like Re-Entry Cluster" | `product-intelligence.ts`, `coach-action-loop.ts`, `saved-trade-threads.ts` | `/coach` severity, archetype, recurrence | review_prompt | losing first attempt, re-entry sequence, time gap, same-symbol story, repeated losses | rapid-fire cluster, gross loser, same-symbol thread in separate read model | proof of emotional revenge intent is never available | Never state emotional intent as fact. Use "possible" or "review." | thread-level evidence available | `/coach`, `/review`, `/analytics`, `/trades/[tradeId]` | Review quick re-entry pressure | Compare the re-entry sequence and decide where a cooldown should begin. | prompt only, no primary conclusion from emotional label | `src/lib/user-facing-behavior/...`, `coach-action-loop.ts` |
| `early_winner_exit` / "Early Winner Exit" | `product-intelligence.ts`, `coach-action-loop.ts`, user-facing review mapper | `/coach` severity, session prep | review_prompt | winner context, exit timestamp, post-exit continuation window | weak first-reduction evidence and gross P/L | post-exit continuation and candle context | Do not say money was left on table unless continuation evidence exists. | chart-context available for certified claim; execution-only for prompt | `/coach`, `/review`, `/analytics`, `/trades/[tradeId]` | Review whether the winner was sold too soon | Check whether the exit matched your plan or happened before the move was finished. | prompt fallback and post-exit positive later | `src/lib/user-facing-behavior/...`, user-facing review mapper later |
| `exit_left_continuation` | `build-trade-decision-review.ts`, saved decision-review snapshots | `/coach`, `/analytics`, `/progress`, `/trades`, `/review`, `/trades/[tradeId]` chart finding cards | certified_detection | final exit timestamp, post-exit candle window, max favorable move after exit inside calibrated safe range | post-exit candle count, max favorable move after exit, net post-exit move | larger-move calibration, saved exit plan | Do not show from missing post-exit candles. Do not say the trader should have held or guarantee missed profit. | market-context certified only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Exit came before more continuation | Review whether the final exit had a planned reason or whether a runner rule would have helped. | missing post-exit negative guard; calibrated continuation positive | `build-trade-decision-review.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `exit_needs_post_exit_context` | `build-trade-decision-review.ts`, saved decision-review snapshots | after-exit review prompt cards | review_prompt | premature-exit pattern plus missing/incomplete post-exit candles | exit-quality pattern, post-exit candle count, null/unsafe max favorable move | aligned post-exit candles | Do not call it continuation left behind. Do not drive risk/strength counts. | market-context prompt only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Exit needs after-exit chart check | Review whether the exit had a planned reason, then wait for after-exit chart context before making a continuation conclusion. | prompt-only mapping, saved-thread prompt count | `build-trade-decision-review.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `exit_large_post_exit_move_needs_review` | `build-trade-decision-review.ts`, saved decision-review snapshots | after-exit review prompt cards | review_prompt | post-exit candles, unusually large favorable move after exit, calibrated threshold | post-exit candle count, max favorable move after exit, net post-exit move | calibration proving the move is same basis/symbol and safe to use | Do not call it money left behind until calibrated. Do not imply future hold decisions. | market-context prompt only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Large after-exit move needs review | Review the after-exit move manually before turning it into a coaching conclusion. | oversized move stays prompt-only | `build-trade-decision-review.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `reductions_near_resistance` | `build-trade-decision-review.ts`, saved decision-review snapshots | chart-context findings, after-exit evidence cards, trade detail/review/analytics/coach/progress via saved thread read model | certified_detection | reduction or exit near daily/4h resistance with saved level evidence | decision-review level insight, support/resistance evidence, execution reduction timing | user plan and exact target intent | Do not imply future sells should always happen at resistance. Treat as a strength to repeat when evidence shows the trader reduced risk into overhead supply. | market-context certified only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Reduced near resistance | Review what made this reduction planned and repeatable. | mapper positive, decision-review support/resistance exit positive | `build-trade-decision-review.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `exit_into_resistance_with_reversal_after_exit` | `build-trade-decision-review.ts`, saved decision-review snapshots | chart-context findings and after-exit evidence cards | certified_detection | exit near daily/4h resistance plus measured reversal/fade after exit | resistance level evidence, post-exit movement evidence | exact user target plan | Do not say "top tick" or guarantee the exit was perfect. Say the exit protected against later fade. | market-context certified only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Exit protected profit near resistance | Compare the exit to nearby resistance and the after-exit fade. | resistance reversal positive, no post-exit fade negative | `build-trade-decision-review.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `exit_into_resistance_before_breakout` | `build-trade-decision-review.ts`, saved decision-review snapshots | chart-context findings and after-exit evidence cards | certified_detection | exit near resistance plus measured breakout/continuation after exit | resistance level evidence, after-exit breakout evidence | saved trade plan and runner rule | Do not say the user should have held. Frame as a runner-plan review. | market-context certified only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Exit before resistance break | Review whether a small runner rule would have matched the plan. | resistance breakout positive, missing/oversized after-exit negative | `build-trade-decision-review.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `exit_into_support_before_breakdown` | `build-trade-decision-review.ts`, saved decision-review snapshots | chart-context findings and after-exit evidence cards | certified_detection | exit near support plus measured breakdown after exit | support level evidence, after-exit breakdown evidence | saved invalidation plan | Do not say support always breaks or that the exit was a signal. Frame as loss/profit protection. | market-context certified only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Exit avoided support break | Review how the exit protected the trade as support failed. | support breakdown positive, no breakdown negative | `build-trade-decision-review.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `exit_into_support_with_relief_after_exit` | `build-trade-decision-review.ts`, saved decision-review snapshots | chart-context findings and after-exit evidence cards | review_prompt | exit near support plus later relief/bounce after exit | support level evidence, post-exit relief evidence | saved stop/target plan and whether exit was defensive or early | Do not call this a mistake without the trader's plan. Ask whether the exit matched invalidation. | market-context prompt only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Support exit needs review | Check whether the support exit followed your invalidation or happened before the trade repaired. | support relief prompt positive, no primary risk count | `build-trade-decision-review.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `reentry_volume_faded` | `saved-trade-threads.ts`, saved snapshot evidence | ticker-story evidence cards, analytics/coach/progress/trades thread context | certified_detection | same-symbol later re-entry, first-entry volume, later-entry volume, later outcome weaker | saved snapshot volume evidence, round-trip order, P/L by attempt | candle structure and level reason for fade | Do not certify without numeric volume evidence. Do not call it emotional trading. | thread-level volume evidence available | `/coach`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Re-entry volume faded | Compare the first entry volume with the later re-entry and decide whether the second attempt needed stronger confirmation. | volume faded positive, missing volume negative | `saved-trade-threads.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `reentry_volume_confirmed` | `saved-trade-threads.ts`, saved snapshot evidence | ticker-story evidence cards, analytics/coach/progress/trades thread context | certified_detection | same-symbol later re-entry, first-entry volume, later-entry volume, later outcome nonnegative or unknown | saved snapshot volume evidence, round-trip order, P/L by attempt | candle/level reason for confirmation | Do not imply volume guarantees the trade; treat as strength to review/repeat. | thread-level volume evidence available | `/coach`, `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]` | Re-entry volume confirmed | Review what confirmation was present before the later attempt. | volume confirmed positive, missing volume negative | `saved-trade-threads.ts`, `src/lib/user-facing-behavior/...`, saved-thread tests |
| `all_or_nothing_exit_after_many_adds` / "All-Or-Nothing Exit After Many Adds" | `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` severity, rule ideas | certified_detection | several adds, one heavy exit/reduction sequence | risk ID from execution summary | market reason for exit | Do not call it bad if the trade protected risk well; ask what the exit plan was. | execution-only | `/coach`, `/review`, `/analytics`, `/trades/[tradeId]` | Many adds before one large exit | Review whether risk was reduced soon enough or left for one final exit. | many-adds exit positive and staged-exit negative | `src/lib/user-facing-behavior/...`, `coach-action-loop.ts` |
| `partialed_without_plan` / "Partialed Without Plan" | `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` severity, rule ideas | review_prompt | reduction sequence, planned targets/checklist, open-profit path | reduction inconsistency risk IDs | user plan and context | Do not claim no plan without user plan evidence. | saved review completed for certified claim; execution-only for prompt | `/coach`, `/review`, `/trades/[tradeId]` | Review the partial exits | Check whether each partial had a planned reason or was reactive. | prompt only until saved review plan exists | `src/lib/user-facing-behavior/...` |
| `inconsistent_sizing` / "Inconsistent Sizing" | `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` severity, scorecard, rule ideas | certified_detection | large share-size variation across executions/trades | share-size variation risk ID | setup quality or risk-per-trade target | Do not say wrong size without account/risk plan. | execution-only | `/coach`, `/review`, `/analytics`, `/progress`, `/trades/[tradeId]` | Inconsistent position sizing | Compare share sizes and set one sizing rule for similar setups. | inconsistent positive and stable negative | `src/lib/user-facing-behavior/...` |
| `impulsive_reversal` / "Impulsive Reversal" | `product-intelligence.ts` | potential future product intelligence | internal_only | direction reset, market context, trade plan | none in current primary routes | reliable reversal/re-entry evidence | Keep out of primary UI. | advanced/admin only | advanced/admin | Advanced behavior signal | Keep this in advanced diagnostics until a contract exists. | internal-only fail-closed test | `src/lib/user-facing-behavior/...` |
| `repeated_rule_violation` / "Repeated Rule Violation" | `trader-improvement.ts`, `product-intelligence.ts`, `coach-action-loop.ts` | `/coach` rule ideas and recurrence | review_prompt | saved personal rule, repeated violations | rule evaluation counts | whether the rule is actually useful | Do not imply the rule is correct; ask whether it should be tightened. | saved review/rule evidence available | `/coach`, `/review`, `/progress` | Review repeated rule breaks | Inspect the linked trades and decide whether the rule needs a clearer threshold. | rule prompt test | `src/lib/user-facing-behavior/...` |

## Implementation Notes

- 2026-05-10 add-quality hardening update:
  - execution-only adverse-add detections (`scaled_loser`,
    `add_after_adverse_move`) are review prompts, not primary risks;
  - chart-confirmed weak adds remain certified through
    `adds_increased_risk_into_weakness`;
  - constructive add evidence remains certified through
    `adds_aligned_with_strength`;
  - saved trade threads now expose add-quality, post-exit, level, and volume
    evidence counts so routes can show what kind of chart context exists
    without overclaiming.
- 2026-05-10 after-exit certification update:
  - `exit_left_continuation` is certified only when post-exit candle evidence
    exists and the favorable move is inside the current calibrated safe range;
  - missing post-exit candles map to `exit_needs_post_exit_context`;
  - oversized after-exit moves map to
    `exit_large_post_exit_move_needs_review`;
  - both new after-exit outputs are review prompts and cannot drive risk,
    strength, cost, or rule conclusions;
  - chart-confirmed weak-add copy now says "Added before the trade repaired,"
    and adverse-add rule suggestions use repair-first language.
- 2026-05-10 support/resistance exit and re-entry volume update:
  - support/resistance-aware exits are certified only from saved market-context
    evidence, with support-relief cases staying prompt-only when the plan is
    ambiguous;
  - first-entry versus re-entry volume comparison is certified only when saved
    snapshot evidence exposes numeric volume for both attempts;
  - missing volume evidence produces no volume claim;
  - execution-only adverse adds remain available in analytics drilldowns as
    review prompts, not as top certified risk expectations.
- `/coach` primary severity/focus conclusions now filter to certified
  detections only through `src/lib/user-facing-behavior`.
- Product intelligence cost estimates and recurrence alerts now filter out
  prompt-only behaviors before they can drive rule recommendations or review
  queue cost items.
- Improvement visuals, daily coach session leak copy, best/worst repeated
  mistake copy, and review-habit rule drafts now use mapped behavior copy and
  exclude prompt-only detections from primary conclusions.
- Product evidence cards now filter to certified detections before rendering
  mistake evidence cards.
- Review-prompt behaviors can still be shown as things to inspect, but they
  cannot drive the page headline, fix-first action, top severity card, primary
  coaching focus, cost driver, mistake-frequency chart, rule draft, or primary
  evidence card.
- Raw/internal names may remain in expanded advanced details for builders only,
  not in visible collapsed disclosure titles or normal cards.
- Analytics report digests, analytics behavior charts, saved-trade selectors,
  import preview labels, review queue diagnostics, import diagnostics, and
  trade-detail chart-context status now route through product-safe mapped copy
  or explicit plain state labels before reaching normal UI.
- The mapper test suite now includes every current execution-feedback
  risk/strength/review-prompt behavior ID that can surface in analytics and
  coaching read models. This includes `adverse_price_adds` as a safe alias for
  the adverse-add execution behavior.
- The decision-review bridge and quality dashboard now pass deterministic
  daily/4h level scenarios for entries near major resistance, limited room to
  resistance, and entries near support. The test fixtures were corrected to
  match the current sample levels instead of loosening detector thresholds.
- Same-symbol ticker-story output now has explicit story kinds for profit
  giveback, repeated losing attempts, open re-entry, day-trade-to-swing
  transition, and re-entry added profit. Route code should consume those story
  kinds instead of inferring story meaning from P/L and lifecycle fragments.
- Repeated losing attempts have a negative guard against profit-giveback copy:
  profit-giveback language requires a positive cumulative P/L peak before
  later giveback.
- Saved decision-review market-context insights now map into product-ready
  chart-context findings before route consumption. The saved trade-thread read
  model exposes finding counts, risk/strength/prompt splits, post-exit counts,
  level counts, and volume-evidence counts.
- `/trades/[tradeId]`, `/review`, `/coach`, `/analytics`, `/progress`, and
  `/trades` consume the chart-context finding read model instead of raw
  decision-review insight IDs. Short-specific findings are hidden in normal
  routes, and prompt-only during-trade measurements cannot drive risk or
  strength counts.

## Remaining Route Audit Notes

The next slice should not repeat the completed mapper, report-selector, ticker
story, session-story, or chart-context finding bridge passes. Instead, inspect
these route surfaces only for concrete remaining primary-copy, visual, or
workflow defects:

- `/trades/[tradeId]`: session-story handoff, similar-trade evidence, and
  chart-context finding prioritization only when evidence is clear.
- `/review`: session-story queue handoff and coach sidebar copy, not a rebuild
  of chart-context queue reasons.
- `/analytics`: deeper volume/post-exit analytics only after the evidence
  contract exists.
- `/progress`: follow-through for completed reviews and certified
  strength-to-repeat behavior.
- `/trades`: additional filters only when labels are trader-readable and backed
  by the shared read model.

Avoid route-local string replacement. If a route needs behavior language, add a
contract or call the shared mapper and fail closed when a contract is missing.
The next detection-heavy work should focus on market-context volume/post-exit
contracts and deeper same-symbol/session strengths rather than adding more
route-local copy tables.
