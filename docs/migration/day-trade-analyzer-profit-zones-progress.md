# Day Trade Analyzer Profit Zones Progress

**Plan:** [Day Trade Analyzer Version 2 Plan](day-trade-analyzer-v2-plan.md)

**Status:** Owner-directed Green-to-Red and compact zone-ladder refinement is
implemented locally and has passed focused low-resource source QA. No push,
deployment, migration, hosted data write or configuration change is authorized
to this worker.

## Current user-defined-trade refinement — 2026-09-05

- [x] Work remains isolated in the assigned
  `C:\Users\jerac\Documents\TraderLink\worktrees\trade-analyzer-v2`
  worktree on branch `codex/day-analyzer-profit-zones-repair-71193458`.
- [x] This refinement is parented to local commit
  `aecfcb1c9be9c05214617da8520bce7ecd09e76a`.
- [x] The owner has not authorized a coordinator handoff, push or deployment
  for this refinement.

## Git and ownership checkpoint — 2026-09-05

- [x] Visual release coordinator assigned the existing clean worktree
  `C:\Users\jerac\Documents\TraderLink\worktrees\trade-analyzer-v2`.
- [x] Branch is `codex/day-analyzer-profit-zones-8d422ee`.
- [x] Exact parent is current production
  `8d422ee46459235381986c308afc4a281d74f180`.
- [x] Prior V2 branch remains preserved unchanged.
- [x] Dirty canonical checkout and unrelated Workspace/TradingView work remain
  excluded.

## Owner-approved product contract

- [x] The chart and matrix summarize all analyzed trades in the selected date
  range and selected direction.
- [x] The purpose is to show where profit-taking opportunities occurred, where
  recorded profit was taken, which levels progressed, and which no-profit
  cases completed red; it does not advise or grade the trader.
- [x] Every profitable exit fill belongs to exactly one exclusive percentage
  band and contributes its exact Gross realized profit there.
- [x] Cumulative level-reach counts do not double-count quick moves as extra
  trades.
- [x] Calculated opportunity, recorded profit and realized losses remain
  visibly distinct.
- [x] Time to level, continuous time at/above level and total holding time
  remain visible.
- [x] Every aggregate retains exact supporting trades.
- [x] Short presentation remains hidden when the period has no short trades.

## Implementation

- [x] Add deterministic per-trade profit-zone facts to the V2 scenario engine.
- [x] Add direction-aware aggregate zone rows to the long-term read model.
- [x] Add the collective progression chart and exact matrix to Scaling Out.
- [x] Add zone-selected exact supporting records.
- [x] Preserve date-filter, reporting-currency, offline and direction behavior.
- [x] Replace vague result wording in the affected meaningful-profit and
  scale-out tables with explicit profit opportunity and final trade P/L labels.
- [x] Complete focused low-resource QA without Vitest or a local production
  build.
- [x] Create a narrow local commit and hand it to the Visual release
  coordinator.

## Verification

- [x] Focused ESLint passed for the two affected UI files, the scenario engine,
  aggregate service and offline saved-view contract.
- [x] `git diff --check` passed.
- [x] Source audit confirmed cumulative threshold counts create one record per
  trade and threshold, while profitable exits contribute to one exclusive
  band only.
- [x] Source audit confirmed no-profit ended-red rates use trades taking no
  profit in that band as their denominator.
- [x] Source audit confirmed Gross recorded profit, Gross final losses and
  calculated Gross level opportunity remain separate values.
- [x] Offline capture replaces exact round-trip IDs in the new evidence rows
  with the existing local offline references.
- [ ] Repository-wide TypeScript compilation did not finish: the Node process
  exhausted its 2 GB heap after about 74 seconds. It produced no TypeScript
  diagnostic before the resource failure and was not retried at a larger heap
  on the owner's low-resource computer.
- [ ] Integrated Light/Dark desktop/mobile rendering remains intentionally
  deferred to the authorized online review after release.

## Production build repair — 2026-09-05

- [x] The first Railway build failed before replacing the live application;
  the Visual release coordinator restored the prior production content and
  verified healthy production service.
- [x] A focused five-file TypeScript project reproduced the blocking source
  error: the new `Profit taking by price level` section omitted the required
  shared `Section.helpHref` prop.
- [x] Added the existing Scaling Out help target without changing help content.
- [x] The focused five-file TypeScript compilation now passes.
- [x] Focused ESLint and `git diff --check` pass after the repair.
- [x] Clean repair commit `54bd4f5eb96555307f2dd19ccf35806907d9b209`
  was created directly on restored production
  `71193458da04603cb6d0d3a8134a6ce3a4c0aa95`, released by the Visual release
  coordinator and verified healthy in production and staging.

## Production chart wording correction — 2026-09-05

- [x] Owner identified that the progression annotation `4 reached +30% · 3
  did not` failed to name the seven-trade +20% starting group.
- [x] Each chart row now states the complete relationship directly: how many
  trades reached the current threshold, and, of those exact trades, how many
  reached or did not reach the next threshold.
- [x] The percentage at the right remains the current threshold's cumulative
  reach rate; it is no longer visually paired with an unexplained trade count.
- [x] Owner then refined the level presentation to make percentages and money
  the primary decision facts rather than shares or unexplained counts.
- [x] The selected level now states the percentage of all trades reaching the
  threshold and their combined calculated Gross profit available.
- [x] It separately states the percentage of level-reaching trades with a
  recorded partial or final exit in the exclusive zone and their exact Gross
  profit taken; the copy explicitly says the trade may have continued.
- [x] It states both denominators for failure to progress: percentage of all
  selected trades and percentage of trades reaching the current threshold,
  together with calculated Gross opportunity on the trades that did not reach
  the next level.
- [x] Visible shares-sold columns were removed. Exact profit taken, opportunity,
  red finishes, losses and time facts remain visible.
- [x] A zero profit-taking rate is presented directly as `You took no profit in
  this zone`, not softened or implied to be a positive behavior.

## Green-to-Red and compact zone-ladder refinement — 2026-09-05

- [x] Green-to-Red now uses a single inclusion boundary: price reached +20% or
  more while shares were open. The sustained-close rules no longer exclude a
  short-lived +20% move from this page.
- [x] The page leads with the percentage and count reaching +20%, combined
  maximum Gross profit opportunity, exact Gross profit taken, percentage later
  turning red, and percentage plus combined loss finishing red.
- [x] Finished-red trades are split into no-profit-taken and
  some-profit-taken groups. Recovery after first turning red remains a separate
  fact.
- [x] Exact finished-red records show maximum gain, maximum Gross opportunity,
  peak ten-point zone, total time in that zone, Gross profit taken, final Gross
  P/L and the opportunity-to-final difference.
- [x] The oversized progression bars and wide duplicate matrix were replaced
  by a compact vertical zone ladder. The 20–30% zone is at the bottom and the
  100%+ zone is at the top.
- [x] Each zone uses a subtle transparent color progression and contains its
  reach rate, profit-taking rate and dollars, stopped-here rate and opportunity,
  and median time in zone.
- [x] Long definitions moved into tooltips and the new numbers use compact type
  rather than oversized metric-card typography.
- [x] The page title, route card and left navigation now use the direct name
  `Green to red` so the analysis is easy to find.
- [x] The exact zone table was reduced to the facts needed to audit the selected
  zone; all exact-trade links remain.
- [x] Offline saved views replace the new exact round-trip identifiers with
  local offline references.
- [x] Focused ESLint and a nine-file TypeScript project pass.
- [x] Small runtime probes cover both a long and short trade reaching +20%,
  taking partial profit and ultimately finishing red.
- [x] Separate profitable partial exits from profitable full-position exits in every
  zone. The ladder rate must use partial-profit trades divided by trades that
  reached the zone, while exact records show before-next, after-next-pullback
  and full-position-exit facts separately.
- [x] The ladder now prints all denominators directly: reached trades out of
  all analyzed user-defined trades, partial-profit trades out of trades that
  reached the zone, and stopped trades out of trades that reached the zone.
- [x] Partial-profit totals use exact Gross profit dollars from recorded
  partial exits. Raw share quantity is not used as the comparison because share
  price differs across trades.
- [x] Focused TypeScript and ESLint pass, and a small runtime probe separates a
  $2.50 partial profit from a $22.50 full-position profit while correctly
  distinguishing partial profit before versus after reaching the next zone.
- [x] Move the new zone and Green-to-Red populations from legacy round-trip
  facts to the current user-defined logical-trade analyzer. One saved trade
  counts once even when it contains multiple flat-to-flat position cycles.
- [x] A multi-cycle runtime probe keeps two entries, two profitable partial
  exits, one temporary return to flat, one re-entry and one final exit inside a
  single analyzed trade; it reconciles $37.50 final Gross P/L and $12.50 Gross
  partial profit without treating the temporary flat as a partial exit.
- [x] Exact zone records label profitable exits that return the position to
  flat without implying that the user-defined trade ended; the saved trade may
  continue with a later re-entry.
- [x] Older offline snapshots fall back to their existing direction counts and
  render unavailable new partial-profit fields safely instead of failing.
- [x] The compact ladder now leads with the percentage of zone-reaching trades
  that recorded any profitable exit in the zone and its exact Gross dollars.
  It then separates profitable partial exits and profitable full exits, with
  separate rates and Gross dollar totals.
- [x] When a saved trade partially exits and later fully exits in the same
  zone, the ladder shows the overlap explicitly. The overall profitable-exit
  rate remains a deduplicated trade rate rather than adding overlapping rates.
- [x] Stopped-here remains independent of profit taking, so a zone can show
  partial scaling profit while correctly showing zero trades stopped there.
- [x] Focused TypeScript, ESLint and `git diff --check` pass after adding the
  percentage-first profit-exit breakdown.
- [x] Trader-facing chart and table wording uses `Full exit` instead of
  `Returned flat`; its tooltip states that all remaining open shares were sold
  and that the saved trade may still contain a later re-entry.
- [x] Audited the complete `/analytics/trade-analyzer/day` route group: result
  models, direction counts and evidence lists are sourced only from ready
  analyzer records. Unanalyzed completed trades remain coverage status only.
- [x] Every page now exposes its analyzed-trade population near the top. Green
  to Red and Profit Zones use their user-defined analyzed-trade counts for the
  top number and Long/Short selection instead of the legacy round-trip count.
- [x] Below the top count, captions and denominators use ordinary `trades`
  wording because the route context already establishes the analyzed
  population.
- [x] Focused TypeScript, ESLint and `git diff --check` pass for the shared top
  count and direction-population correction.
- [x] Replace the overlapping profit-exit presentation with the owner-specified
  exclusive split. The ladder now shows the percentage of zone-reaching trades
  taking profit and its Gross dollars, then partial-exit trades and full-exit
  trades as an exclusive breakdown of profit-taking trades that adds to 100%.
- [x] Remove the redundant `X of X` count from the profit-taking cell. Counts
  remain available through the reached population and exact supporting records.
- [x] Correct the profit-taking denominator: zone reach now uses favorable
  recorded candle movement (high for longs, low for shorts), while profitable
  sells remain the numerator. Exact sell executions can still prove an
  intraminute reach, but no longer define the complete reached population.
- [x] Focused runtime proof covers the owner-reported failure: seven trades
  reaching a zone with zero profitable sells returns 0%; three profitable sells
  returns 42.9%; and 100% appears only when every reaching trade takes profit.
- [x] Focused TypeScript, ESLint and `git diff --check` pass for this correction.
- [x] Correct Full exit to mean an all-at-once position-cycle exit. A final sell
  after any earlier scale-out stays under Partial exits; its remaining-share
  profit is no longer mislabeled as an all-at-once Full exit.
- [x] Use the analyzer's exact execution-summed Gross result for the exact
  Profit Zones record so Final Gross P/L reconciles with the executions used by
  the same row instead of mixing a separate Analytics-row total into it.
- [x] Focused runtime proof confirms a $3 fee changes only Net, never Gross, and
  confirms that a final remaining-share sell after scaling contributes $0 to
  Full exit while an all-at-once exit contributes its complete Gross profit.
- [x] Key Profit Zones by the current platform trade identity:
  `logicalTradeId` for a user-defined trade and `roundTripId` only when no
  logical trade exists. Multiple CELU or LGPS trades remain separate; ticker is
  display text only.
- [x] Preserve a ready one-member round-trip analysis when that same trade has
  been materialized into the logical-trade system but has not received a newer
  logical analysis. Multi-member trades still require their combined analysis.
- [x] Use each canonical trade's own execution-summed scenario Gross P/L in its
  exact zone row. The affected demo trades contain six $0.50 execution fees;
  the prior $3-lower value was fee-inclusive. Fees now affect Net only and
  cannot reduce the Final Gross value.
- [x] Simplify the selected-zone evidence heading to the exact non-overlapping
  range (for example, `20%–29.99%`) and state its count against the page's
  analyzed-trade population without repeating a second range chip.
- [x] Move the definitions for First Reached, Time to Zone, Time in Zone,
  Partial Profit, Full Exit Profit, Gross Opportunity and Final Gross P/L into
  plain-language table-heading tooltips. Remove the repeated reach-source and
  full-exit explanations from every evidence row.
- [x] Keep Full Exit Profit limited to fully exiting the position with one sell
  order, and render Next Zone outcomes in the smaller supporting-text size.
- [x] Left-align every exact-trade heading and value, reduce horizontal cell
  padding, and assign compact column widths so Full Exit Profit and every
  following column move left instead of leaving large empty gaps.
- [ ] Integrated Light/Dark desktop/mobile rendering remains deferred to the
  authorized online review after release.
