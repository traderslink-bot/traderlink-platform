# SKLZ Extreme Excursion Audit - 2026-05-06

Source artifact:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes.json`

## Result

The SKLZ extreme excursion row is valid. Do not patch the excursion math and do
not backfill more candles for this case.

## Trade

- Review id: `dry-run-trade-182-sklz`
- Symbol: `SKLZ`
- Entry execution: `2026-04-23 12:36:34 ET`, `35` shares at `6.12`
- Exit execution: `2026-04-23 13:31:07 ET`, `35` shares at `11.37`
- Realized move from first entry to exit: about `85.8%`
- Review source:
  - market context: `levels_system_daily_4h`
  - trade-window evidence: `levels_system_trade_window`
  - candle note: `1m` unavailable, `5m` fallback used
  - basis note: `basis_aligned`

## Warehouse Candle Check

The shared warehouse `5m` candles for `2026-04-23` show a real intraday spike:

- `2026-04-23T16:30:00Z`: high `6.12`
- `2026-04-23T16:35:00Z`: high `6.73`
- `2026-04-23T16:40:00Z`: high `7.39`
- `2026-04-23T16:55:00Z`: high `12.32`
- `2026-04-23T17:10:00Z`: high `18.70`
- `2026-04-23T17:20:00Z`: high `20.00`
- `2026-04-23T17:30:00Z`: high `12.88`

The `4h` and `daily` warehouse candles agree with the `20.00` high:

- daily `2026-04-23`: `open=3.69`, `high=20.00`, `low=3.25`, `close=8.81`
- 4h segment beginning `2026-04-23T16:00:00Z`: `high=20.00`

## Metric Reconciliation

- `tradeMfePct=226.8%` comes from `(20.00 - 6.12) / 6.12`.
- `firstEntryToPeakMovePct=226.8%` is the same move because the peak occurred
  after entry while the trade was open.
- `favorableExcursionLeftOnTablePct=141.0%` comes from the difference between
  the full `226.8%` favorable excursion and the realized `85.8%` exit move.
- `maxFavorableMovePctAfterExit=29.6%` is consistent with post-exit candles
  reaching `14.74` after the `11.37` exit.

## Interpretation

SKLZ was an extreme small-cap intraday move, not an adjustment/basis mismatch:

- execution prices are compatible with nearby candle prices;
- provider metadata reports raw IBKR candles;
- higher-timeframe candles confirm the same daily high;
- the bridge marked the row `basis_aligned`.

## Follow-Up

- Keep SKLZ as a valid extreme excursion in calibration summaries.
- Do not change thresholds based on this row alone.
- If the product later wants to reduce shock value, add copy that frames
  triple-digit excursion rows as "verified extreme move" rather than filtering
  them out.
