# Analyzer interval and execution-row follow-up

Owner approved implementation on September 10, 2026. No production handoff authorized.

## Scope

- Summary EMA 9 follows selected 1m/5m context in Session Tracker and Workspace. Five-minute references use the saved last completed five-minute candle, never relabel one-minute data. Session VWAP remains session-based through the execution minute.
- Keep whole-trade P/L, peak, profit path and window timing on exact executions and saved one-minute closes. Chart aggregation must not erase short-lived reversals.
- Place Entries and exits, Profit path and Longest profit window in a compact three-column desktop grid, stacked on mobile.
- Enrich existing Session Tracker execution rows with execution role, remaining shares and gross exit P/L. Preserve all existing values, editing and Show on chart. Match by execution ID, not ticker, time or row index.
- Hide the duplicate card execution expansion only when every calculated execution detail is represented in the existing rows. Keep it in Workspace, which does not have those rows.

## Progress

- Implemented the four-file UI/summary slice. No provider calls, saved-data changes, migrations or financial-method changes.
- Workspace supporting EMA, candle-edge and pattern text now also follows 1m/5m; its session-volume and prior-price measurements remain explicitly minute-based.
- Fixed the summary grammar from “Your first entry ... and added” to a separate “You added” sentence.
- Coordinator confirmed existing clean lane at a47faf780 and byte equality of these files with production parent 8cb9ecc095a3a9705ac82528716011796fe8c761. Only new narrow changes may be integrated; never publish the divergent historical branch.
- Help articles remain deferred until owner acceptance, per the owner's instruction. Existing tooltip updated to explain interval-specific versus fixed-resolution measurements.

## Verification and release boundary

- Source review and whitespace check completed. Targeted ESLint passed with zero errors; the existing unused TradeOutcomeSummary warning remains outside this slice. Automated tests and a full build have not been run under the owner's current testing instruction.
- Rendered acceptance of this follow-up is pending; the inspected production card was the prior version. Do not describe the new layout as live or visually accepted.
- No push, deployment or release request.
