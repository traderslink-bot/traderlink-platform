# Day Trade Analyzer Profit Zones Progress

**Plan:** [Day Trade Analyzer Version 2 Plan](day-trade-analyzer-v2-plan.md)

**Status:** Implementation and focused low-resource source QA are complete and
ready for the Visual release coordinator handoff. No push, deployment,
migration, hosted data write or configuration change is authorized to this
worker.

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
