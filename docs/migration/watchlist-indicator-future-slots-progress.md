# Indicator future-slot repair — 2026-09-15

Parent: [Indicators plan](watchlist-deterministic-indicators-plan.md).

Owner approved repair after read-only production testing of the actual shared
Moomoo connection. At 18:10 ET, YFOR returned current populated native 1m, 5m
and 15m candles, including volume. Responses also padded the rest of the session
with timestamp-only future slots. The adapter rejected those slots and therefore
discarded valid history. Saved production evidence showed Yahoo zero-volume
fallback, an old 07:20 ET 5m result, no 15m result, and incomplete VWAP history.

## Implementation complete; hosted acceptance pending

- Skip only fully empty, valid timestamped future intraday slots using the
  response-observation clock. Count exclusions in existing audit metadata.
- Preserve populated candles, including real zero-volume bars. Existing session
  normalization excludes the unfinished populated candle from calculations.
- Continue rejecting incomplete populated OHLC, historical empty rows, invalid
  timestamps and invalid Daily rows. Never manufacture candles or volume.
- Keep the normal request schedule, provider choice, permissions, UI, formulas,
  AI analysis, approval/edit controls and Discord behavior unchanged.
- Help reviewed: existing completed-candle, VWAP and timestamp explanations
  remain accurate; no Help copy change required.

Verification: 109 history-adapter assertions, 22 session/calendar assertions,
84 refresh-integration assertions pass (215 total), sequential low-resource
Node checks. No new AI or Discord calls. No migration, database mutation,
configuration change, provider subscription change, server or build started.

Coordinator release parent: `177bb61bd196d82f5c71d238e4656cf3f9a8cf08`.
Hosted acceptance must check fresh YFOR 1m/5m/15m timestamps and volumes,
full-session VWAP and restored audit outcomes after normal refresh. Do not
claim production recovery from offline tests alone.
