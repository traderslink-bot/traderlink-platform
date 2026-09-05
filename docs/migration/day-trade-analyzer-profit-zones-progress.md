# Day Trade Analyzer Profit Zones Progress

**Plan:** [Day Trade Analyzer Version 2 Plan](day-trade-analyzer-v2-plan.md)

**Status:** Owner-directed Green-to-Red and compact zone-ladder refinement is
implemented locally and has passed focused low-resource source QA. No push,
deployment, migration, hosted data write or configuration change is authorized
to this worker.

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
- [ ] Integrated Light/Dark desktop/mobile rendering remains deferred to the
  authorized online review after release.
