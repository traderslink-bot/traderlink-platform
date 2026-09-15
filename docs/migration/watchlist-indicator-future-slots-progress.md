# Indicator future-slot repair — 2026-09-15

Parent: [Indicators plan](watchlist-deterministic-indicators-plan.md).

Owner approved repair after read-only production testing of the actual shared
Moomoo connection. At 18:10 ET, YFOR returned current populated native 1m, 5m
and 15m candles, including volume. Responses also padded the rest of the session
with timestamp-only future slots. The adapter rejected those slots and therefore
discarded valid history. Saved production evidence showed Yahoo zero-volume
fallback, an old 07:20 ET 5m result, no 15m result, and incomplete VWAP history.

## Complete — production recovery verified

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

## Hosted acceptance

Coordinator deployed `24a2fdd72f1534c84078eda06daecf55515a22fa` as
`f07d0dd4-fa65-49dc-9b39-bdb836f0d8e1`; build/TypeScript passed, health HTTP200.
Read-only saved production audit at 2026-09-15 18:18:54 ET confirmed normal
refresh outcome `published`, all four frames served by Moomoo without fallback:

- 1m through 18:18 ET: 4,800 shares; EMA9/EMA20/RSI/ATR populated.
- 5m through 18:15 ET: 14,093 shares; EMA9/EMA20/RSI/ATR populated.
- 15m through 18:15 ET: 182,145 shares; EMA9/EMA20/RSI/ATR populated.
- Shared VWAP 1.796512429453475 from 858 completed session minutes, starting
  04:00 ET, zero missing minutes or missing-volume bars.

This acceptance read saved audit only; no extra provider, AI or Discord request
and no app-state mutation. Member browser rendering was not separately checked.

## Owner-approved Yahoo volume follow-up

Yahoo zero-volume candles are now retained for prices with volume marked null:
the fallback cannot distinguish unavailable volume from genuine no-trade zeros.
Positive Yahoo volumes and all valid Moomoo volumes remain unchanged. Missing
volume displays `Unavailable`, cannot display a baseline/change interpretation,
and prevents session VWAP. Missing VWAP also displays `Unavailable`; independent
price-based indicators remain usable. No fabricated volume or provider change.

112 adapter, 7 unavailable-volume/presentation/VWAP and 84 refresh assertions
pass. DOM check initially unavailable due to missing local TypeScript dependency;
no dependencies installed. Release/hosted verification remains pending for this
follow-up. Existing completed-candle and session VWAP Help contracts preserved.
The actual-card DOM check subsequently passed 16 assertions using existing
canonical dependencies, without installation. Help now explains Unavailable.
