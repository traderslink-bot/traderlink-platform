# Weak Level Evidence Audit - 2026-05-06

Source artifact:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes.json`

## Summary

- Weak/no daily/4h level evidence rows: `22`
- Trade-window evidence is present for `17` of the `22` rows.
- The other `5` rows are the intentional price-basis execution-only cases:
  `VEEE`, `ISPC`, and `DGNX`.
- This is not a provider backfill lane. Most rows have market context and are
  being flagged because nearby support or clean resistance room is genuinely not
  available under the current level model.

## By Symbol

- `BTOG`: `5`
- `CYCN`: `3`
- `JTAI`: `3`
- `DGNX`: `2`
- `ISPC`: `2`
- `ADTX`: `1`
- `KIDZ`: `1`
- `LNKS`: `1`
- `MYSE`: `1`
- `PBM`: `1`
- `VEEE`: `1`
- `WLDS`: `1`

## By Evidence Gap

- `nearestResistance=n/a`: `13`
- `roomToNearestResistance=n/a`: `13`
- `distanceToSupport=n/a`: `10`
- `nearestSupport=n/a`: `10`

## Read

- The `VEEE` / `ISPC` / `DGNX` rows should remain execution/P&L-only unless
  raw IBKR candle basis is proven aligned to broker executions.
- The `CYCN`, `JTAI`, `BTOG`, `LNKS`, `KIDZ`, `MYSE`, `PBM`, `ADTX`, and `WLDS`
  rows are better treated as level-model/product-copy calibration, not candle
  availability failures.
- A future refinement can reduce the scary feel of these rows by changing copy
  from "weak/no evidence" toward the actual condition:
  - no nearby support;
  - no clean resistance room;
  - context present, but not supportive.

## Follow-Up

- Do not bulk-fetch candles for these rows.
- If a row looks confusing in the product, promote that exact trade into a small
  synthetic fixture before changing thresholds.
- Keep the reverse-split/basis rows separate from normal weak-context rows in
  readiness reporting.
