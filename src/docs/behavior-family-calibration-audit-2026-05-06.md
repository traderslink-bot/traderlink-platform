# Behavior Family Calibration Audit - 2026-05-06

## Scope

This pass followed the market-data policy work and focused on the highest-volume
decision-review behavior families in the all-eligible private IBKR calibration.
It did not change provider selection, candle fetching, warehouse storage, or the
price-basis policy.

Real provider path used for the rerun:

- `LEVELS_SYSTEM_PROVIDER=ibkr`
- `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY=..\levels-system\data\candles`
- `LEVELS_SYSTEM_WAREHOUSE_MODE=replay`

## Fix

The exit-continuation insight used `maxFavorableMovePctAfterExit` as a ratio,
but the guard compared it to `5`. That effectively allowed post-exit moves up to
500% to count as "plausible" continuation-left evidence.

The guard now compares against `0.05`, so `exit_left_continuation` only appears
when post-exit continuation is unavailable or within the intended 5% band.

A second stale-headline guard was added so the coaching headline cannot say
"exited winner potential too early" unless the filtered insight list still
contains `exit_left_continuation`.

The deterministic dashboard also now treats that headline as insight-dependent,
matching the existing stale-headline protection for adds-aligned wording.

## Calibration Impact

All market-data readiness metrics stayed unchanged:

- requested trades: `208`
- analyzable trades: `206`
- completed reviews: `204`
- execution-only fallback rows: `5`
- unsafe candle-basis rows: `5`
- lower-resolution `5m` fallback rows: `158`
- incomplete trade-window rows: `2`
- weak/no daily/4h level evidence rows: `22`
- missing trade-window excursion insights: `0`

Behavior-family movement:

- `exit_left_continuation` insights: `59 -> 4`
- "The trade exited winner potential too early." headlines: `43 -> 7`
- "Entry was not close to daily/4h support." headlines: `45 -> 61`
- "Adds increased size after much of the move was already used." headlines:
  `10 -> 19`
- "Profit protection was the main review issue." headlines: `0 -> 10`
- extreme excursion metrics: `3 -> 2`

The unchanged market-data counts are the important control: this was a behavior
classification correction, not a candle-readiness regression.

## Current Read

The first threshold fix left `premature_exit` fix-first at `44`, while only `4`
reviews carried `exit_left_continuation`. That meant some fix-first behavior
came from lower-level pattern IDs even when the product-facing insight was
suppressed by the 5% post-exit-continuation guard.

Follow-up alignment was completed in the decision-review layer:

- If the underlying fix-first behavior is `premature_exit` but the visible
  insights do not include `exit_left_continuation`, the review no longer keeps
  `premature_exit` as the product-facing fix-first label.
- If visible evidence includes `profit_protection_failed`, the product-facing
  fix-first label remaps to `poor_profit_protection`.
- If visible evidence includes `adds_increased_risk_into_weakness`, the
  product-facing fix-first label remaps to `adding_into_weakness`.
- Otherwise the product-facing fix-first label is left empty rather than
  overclaiming a registered behavior family that is not visible in the review
  evidence.

Follow-up calibration impact:

- `premature_exit` fix-first labels: `44 -> 3`
- `poor_profit_protection` fix-first labels: `70 -> 81`
- `adding_into_weakness` fix-first labels: `2 -> 6`
- stale premature-exit headlines without `exit_left_continuation`: `0`
- `premature_exit` fix-first labels without `exit_left_continuation`: `0`

All market-data readiness metrics stayed unchanged after this alignment.

## Profit-Protection Alignment

The next audit sampled `poor_profit_protection` rows and found a second
product-facing contradiction: some reviews showed both `profit_protection_failed`
and `exit_captured_trade_well`, with realized capture ranging from roughly `67%`
to `88%`.

The review layer now suppresses `profit_protection_failed` when the same exit
also qualifies as positive capture. The lower-level pattern engine was left
intact; the product-facing review simply avoids presenting a failed-protection
risk when it is already presenting the exit as well captured.

Additional guards:

- A stale profit-protection headline is replaced with the market-aware fallback
  when no `profit_protection_failed` insight remains.
- A stale `poor_profit_protection` fix-first label is removed, or remapped to
  `adding_into_weakness` when visible add-into-weakness evidence exists.

Calibration impact versus the premature-fix-first alignment run:

- `profit_protection_failed` insights: `84 -> 74`
- `poor_profit_protection` fix-first labels: `81 -> 71`
- `adding_into_weakness` fix-first labels: `6 -> 10`
- reviews with both `profit_protection_failed` and `exit_captured_trade_well`:
  `8 -> 0`
- `poor_profit_protection` fix-first labels without visible
  `profit_protection_failed`: `0`

## Scaling Headline Alignment

The scaling audit found many rows with visible scaling risk and no registered
fix-first family. That is not automatically wrong: `adds_after_trade_already_used_range`
means late/extended scaling, not necessarily `adding_into_weakness`.

One narrow copy issue was fixed: when the fallback headline is used and visible
evidence includes `adds_increased_risk_into_weakness`, the review now leads with
"Adds increased risk into weakness" before falling back to generic entry-location
wording.

Final calibration consistency checks:

- `profit_protection_failed` plus `exit_captured_trade_well`: `0`
- `poor_profit_protection` without `profit_protection_failed`: `0`
- `premature_exit` without `exit_left_continuation`: `0`
- `adding_into_weakness` without `adds_increased_risk_into_weakness`: `0`

Final all-eligible headline/fix-first state:

- completed reviews: `204`
- execution-only fallback rows: `5`
- unsafe candle-basis rows: `5`
- weak/no daily/4h level evidence rows: `22`
- `poor_profit_protection` fix-first labels: `71`
- `undersized_winner` fix-first labels: `16`
- `adding_into_weakness` fix-first labels: `10`
- `premature_exit` fix-first labels: `3`
- `flip_flopping` fix-first labels: `1`

## Artifacts

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-exit-threshold-fix.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-exit-threshold-fix-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-exit-threshold-fix-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-pbm-xtlb-vs-exit-threshold-fix-comparison.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-premature-fixfirst-alignment.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-premature-fixfirst-alignment-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-premature-fixfirst-alignment-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-exit-threshold-vs-premature-fixfirst-alignment-comparison.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-profit-protection-alignment.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-scaling-headline-alignment.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-scaling-headline-alignment-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-scaling-headline-alignment-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-premature-vs-scaling-headline-alignment-comparison.md`

## Verification

- `npx vitest run src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`

Both passed after the fix and fixture updates.

## Next Best Step

The behavior-family calibration branch is clean enough to pause here. The next
useful product step is not more candle backfill or broad behavior rewrites; it is
adding a small regression/audit test around the final contradiction buckets above
so future changes cannot reintroduce stale fix-first labels or contradictory
exit insights.

## Behavior Invariant And Sizing Visibility Pass

Followed up with the regression/audit step above and then completed the requested
none/entry-support/undersized/late-add family audit.

What changed:

- Added calibration invariant fields for stale behavior labels and contradictory
  profit-protection/captured-exit rows.
- Added regression coverage for stale `poor_profit_protection`,
  `premature_exit`, `adding_into_weakness`, and `undersized_winner` fix-first
  labels.
- Exposed a visible `winner_stayed_undersized` scaling risk insight whenever
  the normalized underutilized-winner evidence is present. This keeps
  `undersized_winner` product copy tied to a visible review insight instead of
  relying only on the hidden behavior classifier.

Audit reads:

- `none` fix-first rows: `103`. These are mainly market-context warnings,
  late-range add warnings, or constructive/neutral reviews without a registered
  fix-first family.
- `Entry was not close to daily/4h support.` rows: `57/57` have visible
  `entry_far_from_daily_4h_support` evidence.
- `undersized_winner` rows: stale visible-insight count improved `16 -> 0`.
- Late-range add rows: `34/34` have visible
  `adds_after_trade_already_used_range` evidence. Most remain no-fix rows
  because late/extended adding is not automatically the same thing as
  `adding_into_weakness`.

Final all-eligible state after the visible undersized-winner insight:

- completed reviews: `204`
- execution-only fallback rows: `5`
- unsafe candle-basis rows: `5`
- weak/no daily/4h level evidence rows: `22`
- missing trade-window excursion insights: `0`
- extreme excursion metric count: `2`
- fallback/generic headlines: `0`
- stale/contradictory behavior buckets:
  - `profit_protection_failed` plus `exit_captured_trade_well`: `0`
  - `poor_profit_protection` without `profit_protection_failed`: `0`
  - `premature_exit` without `exit_left_continuation`: `0`
  - `adding_into_weakness` without `adds_increased_risk_into_weakness`: `0`
  - `undersized_winner` without `winner_stayed_undersized`: `0`

Additional artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-scaling-vs-invariant-guards-comparison.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-invariant-vs-undersized-visible-insight-v2-comparison.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`

Both passed after the final code changes.
